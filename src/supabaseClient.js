import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hcsdtmzyozrvbzihudxf.supabase.co";
const SUPABASE_KEY = "sb_publishable_w4kLcs3_-cmBFUAywA5zyw_JI-3zB5J";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
