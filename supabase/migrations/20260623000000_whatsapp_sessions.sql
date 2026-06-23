create table ws27_whatsapp_sessions (
  phone text primary key,
  state text not null default 'idle',
  pending jsonb,
  updated_at timestamptz default now()
);
