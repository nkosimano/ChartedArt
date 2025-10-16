/**
 * Integration Tests for Movements System
 * 
 * Tests the complete flow from API to database including:
 * - Movement CRUD operations
 * - Donation flow with Stripe webhooks
 * - Metric aggregation (Tier 1 & Tier 2)
 * - Puzzle piece reservations
 */

const { createSupabaseClient } = require('../src/utils/supabase');
const { handler: listMovements } = require('../src/handlers/movements-list');
const { handler: getMovement } = require('../src/handlers/movements-get');
const { handler: joinMovement } = require('../src/handlers/movements-join');
const { handler: donateToMovement } = require('../src/handlers/movements-donate');
const { handler: stripeWebhook } = require('../src/handlers/stripe-webhook-movements');

describe('Movements System Integration Tests', () => {
  let supabase;
  let testMovement;
  let testUser;

  beforeAll(async () => {
    supabase = createSupabaseClient();
    
    // Create test user
    const { data: user } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    });
    testUser = user.user;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testMovement) {
      await supabase
        .from('movements')
        .delete()
        .eq('id', testMovement.id);
    }
    
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id);
    }
  });

  describe('Movement CRUD', () => {
    test('should create a new movement', async () => {
      const { data, error } = await supabase
        .from('movements')
        .insert([{
          name: 'Test Movement',
          slug: 'test-movement',
          description: 'A test movement for integration testing',
          goal_amount: 10000,
          status: 'active',
          visibility: 'public'
        }])
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('Test Movement');
      
      testMovement = data;
    });

    test('should list active movements', async () => {
      const event = {
        httpMethod: 'GET',
        queryStringParameters: { status: 'active' }
      };

      const response = await listMovements(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThan(0);
    });

    test('should get movement by slug', async () => {
      const event = {
        httpMethod: 'GET',
        pathParameters: { slug: testMovement.slug }
      };

      const response = await getMovement(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.data.id).toBe(testMovement.id);
      expect(body.data.name).toBe('Test Movement');
    });
  });

  describe('Participation Flow', () => {
    test('should allow user to join movement', async () => {
      const event = {
        httpMethod: 'POST',
        pathParameters: { id: testMovement.id },
        headers: {
          authorization: `Bearer ${testUser.access_token}`
        }
      };

      const response = await joinMovement(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.success).toBe(true);
    });

    test('should update participant count in metrics', async () => {
      const { data: metrics } = await supabase
        .from('movement_metrics')
        .select('participant_count')
        .eq('movement_id', testMovement.id)
        .single();

      expect(metrics.participant_count).toBeGreaterThan(0);
    });
  });

  describe('Donation Flow', () => {
    let paymentIntentId;

    test('should create donation with pending status', async () => {
      const event = {
        httpMethod: 'POST',
        pathParameters: { id: testMovement.id },
        headers: {
          authorization: `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify({
          amount: 50.00,
          currency: 'usd'
        })
      };

      const response = await donateToMovement(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.data).toHaveProperty('payment_intent_id');
      
      paymentIntentId = body.data.payment_intent_id;
    });

    test('should update donation status on Stripe webhook', async () => {
      // Simulate Stripe webhook
      const webhookEvent = {
        httpMethod: 'POST',
        headers: {
          'stripe-signature': 'test-signature'
        },
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: paymentIntentId,
              amount: 5000, // $50.00 in cents
              currency: 'usd',
              metadata: {
                movement_id: testMovement.id,
                user_id: testUser.id
              }
            }
          }
        })
      };

      const response = await stripeWebhook(webhookEvent);
      
      expect(response.statusCode).toBe(200);
    });

    test('should update total_raised in metrics after donation', async () => {
      const { data: metrics } = await supabase
        .from('movement_metrics')
        .select('total_raised, total_donations')
        .eq('movement_id', testMovement.id)
        .single();

      expect(metrics.total_raised).toBeGreaterThanOrEqual(50);
      expect(metrics.total_donations).toBeGreaterThan(0);
    });
  });

  describe('Puzzle Piece System', () => {
    let testPiece;

    test('should create puzzle pieces for movement', async () => {
      const { data, error } = await supabase
        .from('puzzle_pieces')
        .insert([{
          movement_id: testMovement.id,
          piece_number: 1,
          total_pieces: 100,
          price: 25.00,
          status: 'available'
        }])
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.status).toBe('available');
      
      testPiece = data;
    });

    test('should reserve puzzle piece atomically', async () => {
      const { data, error } = await supabase
        .rpc('reserve_puzzle_piece', {
          p_piece_id: testPiece.id,
          p_user_id: testUser.id
        });

      expect(error).toBeNull();
      expect(data).toBe(true);

      // Verify status changed
      const { data: piece } = await supabase
        .from('puzzle_pieces')
        .select('status, reserved_by')
        .eq('id', testPiece.id)
        .single();

      expect(piece.status).toBe('reserved');
      expect(piece.reserved_by).toBe(testUser.id);
    });

    test('should prevent double reservation (race condition)', async () => {
      // Try to reserve again
      const { error } = await supabase
        .rpc('reserve_puzzle_piece', {
          p_piece_id: testPiece.id,
          p_user_id: testUser.id
        });

      expect(error).not.toBeNull();
    });
  });

  describe('Metric Aggregation', () => {
    test('should calculate engagement score (Tier 2)', async () => {
      // This would normally be triggered by cron job
      const { data, error } = await supabase
        .rpc('calculate_engagement_scores');

      expect(error).toBeNull();

      const { data: metrics } = await supabase
        .from('movement_metrics')
        .select('engagement_score')
        .eq('movement_id', testMovement.id)
        .single();

      expect(metrics.engagement_score).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Performance Tests', () => {
  test('movements list should respond under 500ms', async () => {
    const start = Date.now();
    
    const event = {
      httpMethod: 'GET',
      queryStringParameters: { status: 'active' }
    };

    await listMovements(event);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });

  test('movement detail should respond under 500ms', async () => {
    const start = Date.now();
    
    const event = {
      httpMethod: 'GET',
      pathParameters: { slug: 'test-movement' }
    };

    await getMovement(event);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
