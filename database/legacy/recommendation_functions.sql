-- AI Recommendation System Database Functions
-- Run these functions in your Supabase SQL editor

-- Function to find users with similar purchase patterns
CREATE OR REPLACE FUNCTION find_similar_users(
  target_user_id UUID,
  limit_users INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  similarity_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH target_user_purchases AS (
    SELECT DISTINCT oi.product_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = target_user_id
      AND o.status = 'paid'
  ),
  user_purchase_vectors AS (
    SELECT 
      o.user_id,
      array_agg(DISTINCT oi.product_id ORDER BY oi.product_id) AS product_ids,
      count(DISTINCT oi.product_id) AS product_count
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'paid'
      AND o.user_id != target_user_id
    GROUP BY o.user_id
    HAVING count(DISTINCT oi.product_id) >= 2
  ),
  similarity_calculations AS (
    SELECT 
      upv.user_id,
      upv.product_count,
      (
        SELECT count(*)
        FROM unnest(upv.product_ids) AS pid
        WHERE pid IN (SELECT product_id FROM target_user_purchases)
      ) AS common_products,
      (
        SELECT count(*)
        FROM target_user_purchases
      ) AS target_product_count
    FROM user_purchase_vectors upv
  )
  SELECT 
    sc.user_id,
    CASE 
      WHEN sc.target_product_count = 0 OR sc.product_count = 0 THEN 0.0
      ELSE (
        sc.common_products::FLOAT / 
        (sc.target_product_count + sc.product_count - sc.common_products)::FLOAT
      )
    END AS similarity_score
  FROM similarity_calculations sc
  WHERE sc.common_products > 0
  ORDER BY similarity_score DESC
  LIMIT limit_users;
END;
$$;

-- Function to get collaborative filtering recommendations
CREATE OR REPLACE FUNCTION get_collaborative_recommendations(
  target_user_id UUID,
  similar_user_ids UUID[],
  limit_products INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  currency TEXT,
  category TEXT,
  style TEXT,
  medium TEXT,
  dominant_colors TEXT[],
  image_url TEXT,
  artist_id UUID,
  artist_name TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  recommendation_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH target_user_products AS (
    SELECT DISTINCT oi.product_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = target_user_id
      AND o.status = 'paid'
  ),
  target_user_views AS (
    SELECT DISTINCT ubh.product_id
    FROM user_browsing_history ubh
    WHERE ubh.user_id = target_user_id
  ),
  similar_users_products AS (
    SELECT 
      oi.product_id,
      count(*) AS purchase_count,
      avg(oi.price) AS avg_price
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = ANY(similar_user_ids)
      AND o.status = 'paid'
      AND oi.product_id NOT IN (
        SELECT product_id FROM target_user_products
        UNION
        SELECT product_id FROM target_user_views
      )
    GROUP BY oi.product_id
    HAVING count(*) >= 2
  )
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.currency,
    p.category,
    p.style,
    p.medium,
    p.dominant_colors,
    p.image_url,
    p.artist_id,
    COALESCE(prof.full_name, 'Unknown Artist') AS artist_name,
    p.tags,
    p.created_at,
    (sup.purchase_count::FLOAT / array_length(similar_user_ids, 1)::FLOAT) AS recommendation_score
  FROM similar_users_products sup
  JOIN products p ON p.id = sup.product_id
  LEFT JOIN profiles prof ON prof.id = p.artist_id
  WHERE p.status = 'active'
    AND p.stock_quantity > 0
  ORDER BY recommendation_score DESC, p.created_at DESC
  LIMIT limit_products;
END;
$$;

-- Function to get trending products
CREATE OR REPLACE FUNCTION get_trending_products(
  limit_products INTEGER DEFAULT 20,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  currency TEXT,
  category TEXT,
  style TEXT,
  medium TEXT,
  dominant_colors TEXT[],
  image_url TEXT,
  artist_id UUID,
  artist_name TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  trend_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH product_metrics AS (
    SELECT 
      p.id AS product_id,
      COALESCE(view_count, 0) AS views,
      COALESCE(purchase_count, 0) AS purchases,
      COALESCE(cart_additions, 0) AS cart_adds,
      p.created_at
    FROM products p
    LEFT JOIN (
      SELECT 
        product_id,
        count(*) AS view_count
      FROM user_browsing_history
      WHERE created_at >= NOW() - INTERVAL '%s days'
      GROUP BY product_id
    ) views ON views.product_id = p.id
    LEFT JOIN (
      SELECT 
        oi.product_id,
        count(*) AS purchase_count
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= NOW() - INTERVAL '%s days'
        AND o.status = 'paid'
      GROUP BY oi.product_id
    ) purchases ON purchases.product_id = p.id
    LEFT JOIN (
      SELECT 
        product_id,
        count(*) AS cart_additions
      FROM cart_items
      WHERE created_at >= NOW() - INTERVAL '%s days'
      GROUP BY product_id
    ) cart ON cart.product_id = p.id
    WHERE p.status = 'active'
      AND p.stock_quantity > 0
  ),
  scored_products AS (
    SELECT 
      product_id,
      (
        purchases * 10.0 +
        cart_adds * 3.0 +
        views * 1.0 +
        CASE 
          WHEN created_at >= NOW() - INTERVAL '7 days' THEN 5.0
          WHEN created_at >= NOW() - INTERVAL '14 days' THEN 2.0
          ELSE 0.0
        END
      ) AS trend_score
    FROM product_metrics
  )
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.currency,
    p.category,
    p.style,
    p.medium,
    p.dominant_colors,
    p.image_url,
    p.artist_id,
    COALESCE(prof.full_name, 'Unknown Artist') AS artist_name,
    p.tags,
    p.created_at,
    sp.trend_score
  FROM scored_products sp
  JOIN products p ON p.id = sp.product_id
  LEFT JOIN profiles prof ON prof.id = p.artist_id
  ORDER BY sp.trend_score DESC, p.created_at DESC
  LIMIT limit_products;
END;
$$;

-- Function to find similar products
CREATE OR REPLACE FUNCTION find_similar_products(
  product_ids UUID[],
  limit_products INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  currency TEXT,
  category TEXT,
  style TEXT,
  medium TEXT,
  dominant_colors TEXT[],
  image_url TEXT,
  artist_id UUID,
  artist_name TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  similarity_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH reference_products AS (
    SELECT 
      category,
      style,
      medium,
      dominant_colors,
      tags,
      price
    FROM products
    WHERE id = ANY(product_ids)
  ),
  aggregated_preferences AS (
    SELECT 
      array_agg(DISTINCT category) AS categories,
      array_agg(DISTINCT style) AS styles,
      array_agg(DISTINCT medium) AS mediums,
      array_agg(DISTINCT unnest(dominant_colors)) AS colors,
      array_agg(DISTINCT unnest(tags)) AS combined_tags,
      avg(price) AS avg_price,
      min(price) AS min_price,
      max(price) AS max_price
    FROM reference_products
  ),
  similarity_scores AS (
    SELECT 
      p.id,
      (
        CASE WHEN p.category = ANY(ap.categories) THEN 30 ELSE 0 END +
        CASE WHEN p.style = ANY(ap.styles) THEN 25 ELSE 0 END +
        CASE WHEN p.medium = ANY(ap.mediums) THEN 15 ELSE 0 END +
        (
          SELECT count(*)::FLOAT * 2
          FROM unnest(p.dominant_colors) AS pc
          WHERE pc = ANY(ap.colors)
        ) +
        (
          SELECT count(*)::FLOAT * 1.5
          FROM unnest(p.tags) AS pt
          WHERE pt = ANY(ap.combined_tags)
        ) +
        CASE 
          WHEN p.price BETWEEN ap.min_price * 0.7 AND ap.max_price * 1.3 THEN 10
          WHEN p.price BETWEEN ap.min_price * 0.5 AND ap.max_price * 1.5 THEN 5
          ELSE 0
        END
      ) AS similarity_score
    FROM products p
    CROSS JOIN aggregated_preferences ap
    WHERE p.id != ALL(product_ids)
      AND p.status = 'active'
      AND p.stock_quantity > 0
  )
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.currency,
    p.category,
    p.style,
    p.medium,
    p.dominant_colors,
    p.image_url,
    p.artist_id,
    COALESCE(prof.full_name, 'Unknown Artist') AS artist_name,
    p.tags,
    p.created_at,
    ss.similarity_score / 100.0 AS similarity_score
  FROM similarity_scores ss
  JOIN products p ON p.id = ss.id
  LEFT JOIN profiles prof ON prof.id = p.artist_id
  WHERE ss.similarity_score > 20
  ORDER BY ss.similarity_score DESC, p.created_at DESC
  LIMIT limit_products;
END;
$$;

-- Function to update user segments based on behavior
CREATE OR REPLACE FUNCTION update_user_segments()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clear existing segments
  TRUNCATE user_segments;

  -- High-value customers (multiple purchases, high total spend)
  INSERT INTO user_segments (user_id, segment_name, segment_attributes)
  SELECT 
    o.user_id,
    'high_value' AS segment_name,
    jsonb_build_object(
      'total_orders', count(*),
      'total_spent', sum(o.total_amount),
      'avg_order_value', avg(o.total_amount),
      'last_order_date', max(o.created_at)
    ) AS segment_attributes
  FROM orders o
  WHERE o.status = 'paid'
  GROUP BY o.user_id
  HAVING count(*) >= 3 AND sum(o.total_amount) >= 500;

  -- Art enthusiasts (frequent browsers, long session times)
  INSERT INTO user_segments (user_id, segment_name, segment_attributes)
  SELECT 
    ubh.user_id,
    'art_enthusiast' AS segment_name,
    jsonb_build_object(
      'total_page_views', count(*),
      'avg_time_per_page', avg(ubh.time_spent_seconds),
      'unique_products_viewed', count(DISTINCT ubh.product_id),
      'favorite_categories', array_agg(DISTINCT p.category)
    ) AS segment_attributes
  FROM user_browsing_history ubh
  JOIN products p ON p.id = ubh.product_id
  WHERE ubh.created_at >= NOW() - INTERVAL '90 days'
  GROUP BY ubh.user_id
  HAVING count(*) >= 20 AND avg(ubh.time_spent_seconds) >= 45
  ON CONFLICT (user_id, segment_name) DO NOTHING;

  -- Price-sensitive customers
  INSERT INTO user_segments (user_id, segment_name, segment_attributes)
  SELECT 
    o.user_id,
    'price_sensitive' AS segment_name,
    jsonb_build_object(
      'avg_purchase_price', avg(oi.price),
      'max_purchase_price', max(oi.price),
      'total_orders', count(DISTINCT o.id)
    ) AS segment_attributes
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status = 'paid'
  GROUP BY o.user_id
  HAVING avg(oi.price) <= 100 AND count(DISTINCT o.id) >= 2
  ON CONFLICT (user_id, segment_name) DO NOTHING;

  -- New users (recent signups, few interactions)
  INSERT INTO user_segments (user_id, segment_name, segment_attributes)
  SELECT 
    au.id AS user_id,
    'new_user' AS segment_name,
    jsonb_build_object(
      'signup_date', au.created_at,
      'days_since_signup', EXTRACT(days FROM NOW() - au.created_at)
    ) AS segment_attributes
  FROM auth.users au
  WHERE au.created_at >= NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.user_id = au.id AND o.status = 'paid'
    )
  ON CONFLICT (user_id, segment_name) DO NOTHING;

  -- Artist followers (follow multiple artists)
  INSERT INTO user_segments (user_id, segment_name, segment_attributes)
  SELECT 
    uaf.user_id,
    'artist_follower' AS segment_name,
    jsonb_build_object(
      'artists_followed', count(*),
      'followed_artists', array_agg(uaf.artist_id)
    ) AS segment_attributes
  FROM user_artist_follows uaf
  GROUP BY uaf.user_id
  HAVING count(*) >= 3
  ON CONFLICT (user_id, segment_name) DO NOTHING;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_browsing_history_user_product ON user_browsing_history(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_user_browsing_history_created_at ON user_browsing_history(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_products_category_style ON products(category, style);
CREATE INDEX IF NOT EXISTS idx_products_dominant_colors ON products USING GIN(dominant_colors);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_segments_user_segment ON user_segments(user_id, segment_name);

-- Schedule automatic segment updates (run daily)
-- This would typically be set up as a cron job or scheduled function in Supabase
-- SELECT cron.schedule('update-user-segments', '0 2 * * *', 'SELECT update_user_segments();');