-- Link a chat to a verified account. Guest and older conversations remain NULL.
-- No conversation, message or account is deleted or assigned by guessing names.
ALTER TABLE public.chat_conversations
    ADD COLUMN IF NOT EXISTS customer_id INTEGER
        REFERENCES public.users(id) ON DELETE SET NULL;
