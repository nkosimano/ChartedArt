// Mock data for development when backend is not available

export const mockUser = {
  id: 'mock-user-123',
  email: 'user@example.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
};

export const mockCartItems = [
  {
    id: 'cart-1',
    user_id: 'mock-user-123',
    image_url: 'https://picsum.photos/400/300?random=1',
    name: 'Custom Print - 8" x 10"',
    size: '8x10',
    frame: 'black',
    price: 44.99,
    quantity: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cart-2',
    user_id: 'mock-user-123',
    image_url: 'https://picsum.photos/400/300?random=2',
    name: 'Custom Print - 11" x 14"',
    size: '11x14',
    frame: 'white',
    price: 54.99,
    quantity: 2,
    created_at: new Date().toISOString(),
  },
];

export const mockOrders = [
  {
    id: 'order-1',
    user_id: 'mock-user-123',
    total_amount: 99.98,
    status: 'delivered' as const,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    item_count: 2,
  },
  {
    id: 'order-2',
    user_id: 'mock-user-123',
    total_amount: 44.99,
    status: 'shipped' as const,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    item_count: 1,
  },
];

export const mockOrderDetail = {
  id: 'order-1',
  user_id: 'mock-user-123',
  items: [
    {
      id: 'item-1',
      image_url: 'https://picsum.photos/400/300?random=3',
      name: 'Custom Print - 8" x 10"',
      size: '8x10',
      frame: 'black',
      price: 44.99,
      quantity: 1,
    },
    {
      id: 'item-2',
      image_url: 'https://picsum.photos/400/300?random=4',
      name: 'Custom Print - 11" x 14"',
      size: '11x14',
      frame: 'white',
      price: 54.99,
      quantity: 1,
    },
  ],
  total_amount: 99.98,
  status: 'delivered' as const,
  tracking_number: 'TRK123456789',
  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockGalleryItems = [
  {
    id: 'gallery-1',
    user_id: 'mock-user-123',
    image_url: 'https://picsum.photos/400/300?random=5',
    name: 'Sunset Landscape',
    size: '16x20',
    frame: 'wood',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'gallery-2',
    user_id: 'mock-user-123',
    image_url: 'https://picsum.photos/400/300?random=6',
    name: 'City Skyline',
    size: '11x14',
    frame: 'black',
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'gallery-3',
    user_id: 'mock-user-123',
    image_url: 'https://picsum.photos/400/300?random=7',
    name: 'Beach Scene',
    size: '8x10',
    frame: 'white',
    created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'gallery-4',
    user_id: 'mock-user-123',
    image_url: 'https://picsum.photos/400/300?random=8',
    name: 'Mountain View',
    size: '24x36',
    frame: 'none',
    created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
];