import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export const getClientUser = cache(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return { supabase, user }
})