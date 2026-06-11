-- DirectLease Database Schema
-- PostgreSQL

-- Drop existing tables if re-running
DROP TABLE IF EXISTS price_reductions CASCADE;
DROP TABLE IF EXISTS saved_properties CASCADE;
DROP TABLE IF EXISTS viewing_requests CASCADE;
DROP TABLE IF EXISTS viewing_slots CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS tenant_verification_docs CASCADE;
DROP TABLE IF EXISTS landlord_verification_docs CASCADE;
DROP TABLE IF EXISTS terms_acceptance CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS user_type_enum CASCADE;
DROP TYPE IF EXISTS property_type_enum CASCADE;
DROP TYPE IF EXISTS property_category_enum CASCADE;
DROP TYPE IF EXISTS listing_status_enum CASCADE;
DROP TYPE IF EXISTS verification_status_enum CASCADE;
DROP TYPE IF EXISTS subscription_status_enum CASCADE;
DROP TYPE IF EXISTS transaction_status_enum CASCADE;
DROP TYPE IF EXISTS viewing_request_status_enum CASCADE;

-- Enums
CREATE TYPE user_type_enum AS ENUM ('landlord', 'seller', 'tenant', 'buyer', 'admin');
CREATE TYPE property_type_enum AS ENUM ('lease', 'sale');
CREATE TYPE property_category_enum AS ENUM (
  'self-contained-studio',
  'bedroom-flat',
  'bungalow',
  'duplex',
  'shop',
  'shared-apartment',
  'student-accommodation',
  'house',
  'land',
  'other'
);
CREATE TYPE listing_status_enum AS ENUM ('pending', 'approved', 'rejected', 'sold', 'leased', 'inactive');
CREATE TYPE verification_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'completed', 'cancelled', 'disputed');
CREATE TYPE viewing_request_status_enum AS ENUM ('pending', 'agreed', 'rescheduled', 'cancelled', 'completed');

-- Users table (landlords, sellers, tenants, buyers, admin)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type user_type_enum NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  tc_accepted BOOLEAN DEFAULT FALSE,
  verification_status verification_status_enum DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Terms acceptance tracking
CREATE TABLE IF NOT EXISTS terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  UNIQUE(user_id)
);

-- Landlord/Seller verification documents
CREATE TABLE IF NOT EXISTS landlord_verification_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nin VARCHAR(20) NOT NULL,
  home_address TEXT NOT NULL,
  utility_bill_url VARCHAR(500) NOT NULL,
  nin_slip_url VARCHAR(500) NOT NULL,
  profile_pic_url VARCHAR(500) NOT NULL,
  status verification_status_enum DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tenant/Buyer verification documents
CREATE TABLE IF NOT EXISTS tenant_verification_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nin VARCHAR(20) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  profile_pic_url VARCHAR(500) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status verification_status_enum DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type property_type_enum NOT NULL,
  category property_category_enum NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price_naira DECIMAL(15, 2) NOT NULL,
  photos_urls TEXT[] DEFAULT '{}',
  videos_urls TEXT[] DEFAULT '{}',
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  status listing_status_enum DEFAULT 'pending',
  is_featured BOOLEAN DEFAULT FALSE,
  ease_of_business_badge BOOLEAN DEFAULT FALSE,
  viewings_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viewing slots (set by landlord/seller)
CREATE TABLE IF NOT EXISTS viewing_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE
);

-- Viewing requests
CREATE TABLE IF NOT EXISTS viewing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES viewing_slots(id) ON DELETE CASCADE,
  status viewing_request_status_enum DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type user_type_enum NOT NULL,
  plan VARCHAR(50) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status subscription_status_enum DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  service_fee DECIMAL(15, 2) NOT NULL DEFAULT 0,
  buyer_protection_legal DECIMAL(15, 2),
  buyer_protection_bgcheck DECIMAL(15, 2),
  seller_protection DECIMAL(15, 2),
  status transaction_status_enum DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price reductions (for Ease of Doing Business badge)
CREATE TABLE IF NOT EXISTS price_reductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_price DECIMAL(15, 2) NOT NULL,
  new_price DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved/Favorite properties (tenant/buyer bookmarks)
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_receiver ON chat_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_property ON chat_messages(property_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_tenant ON viewing_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_property ON viewing_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_property ON transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_landlord ON transactions(landlord_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_user ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_price_reductions_property ON price_reductions(property_id);

-- Insert default admin user (if not already exists)
-- Password: Administrator_01 (bcrypt hash)
INSERT INTO users (user_type, email, password_hash, name, tc_accepted, verification_status)
VALUES (
  'admin',
  'admin@directlease.com',
  '$2b$10$iHrTiR2IGVuDgKlWZrntNO0qOGXfb4Vx83CWTTakbGmyEqieq.8am',
  'Admin',
  TRUE,
  'approved'
)
ON CONFLICT (email) DO NOTHING;