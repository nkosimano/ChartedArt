/**
 * Supabase Database Utility Functions
 * Provides a simplified interface for Lambda functions to interact with Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key (full access)
const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Execute a database function (RPC call)
 * @param {string} functionName - Name of the PostgreSQL function
 * @param {object} params - Parameters to pass to the function
 * @returns {Promise<object>} Result from the function
 */
const callDatabaseFunction = async (functionName, params = {}) => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.rpc(functionName, params);
  
  if (error) {
    console.error(`Database function error (${functionName}):`, error);
    throw error;
  }
  
  return data;
};

/**
 * Query a table with filters
 * @param {string} table - Table name
 * @param {object} options - Query options (select, filter, order, limit)
 * @returns {Promise<Array>} Query results
 */
const queryTable = async (table, options = {}) => {
  const supabase = getSupabaseClient();
  
  let query = supabase.from(table).select(options.select || '*');
  
  // Apply filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (typeof value === 'object' && value.operator) {
        // Advanced filter: { operator: 'gte', value: 100 }
        query = query[value.operator](key, value.value);
      } else {
        // Simple equality
        query = query.eq(key, value);
      }
    });
  }
  
  // Apply ordering
  if (options.order) {
    const { column, ascending = true } = options.order;
    query = query.order(column, { ascending });
  }
  
  // Apply limit
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  // Apply range (pagination)
  if (options.range) {
    const { from, to } = options.range;
    query = query.range(from, to);
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error(`Query error (${table}):`, error);
    throw error;
  }
  
  return { data, count };
};

/**
 * Insert a record into a table
 * @param {string} table - Table name
 * @param {object} record - Record to insert
 * @param {object} options - Insert options
 * @returns {Promise<object>} Inserted record
 */
const insertRecord = async (table, record, options = {}) => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from(table)
    .insert(record)
    .select()
    .single();
  
  if (error) {
    console.error(`Insert error (${table}):`, error);
    throw error;
  }
  
  return data;
};

/**
 * Update a record in a table
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated record
 */
const updateRecord = async (table, id, updates) => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Update error (${table}):`, error);
    throw error;
  }
  
  return data;
};

/**
 * Delete a record (or soft delete)
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @param {boolean} soft - Use soft delete (archived_at)
 * @returns {Promise<boolean>} Success status
 */
const deleteRecord = async (table, id, soft = true) => {
  const supabase = getSupabaseClient();
  
  if (soft) {
    // Soft delete: set archived_at timestamp
    const { error } = await supabase
      .from(table)
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error(`Soft delete error (${table}):`, error);
      throw error;
    }
  } else {
    // Hard delete
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Hard delete error (${table}):`, error);
      throw error;
    }
  }
  
  return true;
};

/**
 * Get a single record by ID
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @param {string} select - Fields to select
 * @returns {Promise<object>} Record
 */
const getRecordById = async (table, id, select = '*') => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Record not found
      return null;
    }
    console.error(`Get record error (${table}):`, error);
    throw error;
  }
  
  return data;
};

/**
 * Verify user authentication from JWT token
 * @param {string} authHeader - Authorization header value
 * @returns {Promise<object>} User object
 */
const verifyAuth = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  const token = authHeader.substring(7);
  const supabase = getSupabaseClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }
  
  return user;
};

/**
 * Check if user is admin
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Is admin
 */
const isAdmin = async (userId) => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  return ['super_admin', 'admin'].includes(data.role);
};

module.exports = {
  getSupabaseClient,
  callDatabaseFunction,
  queryTable,
  insertRecord,
  updateRecord,
  deleteRecord,
  getRecordById,
  verifyAuth,
  isAdmin
};
