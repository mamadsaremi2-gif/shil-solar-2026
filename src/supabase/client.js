import {
  createClient
} from "@supabase/supabase-js";

export const supabase =
  createClient(

    "https://demo.supabase.co",

    "SUPABASE_PUBLIC_KEY"

  );
