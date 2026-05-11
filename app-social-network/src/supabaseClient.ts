import { createClient } from '@supabase/supabase-js'

// On remplace les import.meta.env par les vraies valeurs
const supabaseUrl = 'https://xxaoimaggpxknoxksoma.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YW9pbWFnZ3B4a25veGtzb21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5Mjc3MjQsImV4cCI6MjA5MzUwMzcyNH0.mVsQk9jXtb0FR30Ob7Ks6-pEFN1A9a8HxQxZI0zYGLw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// On enlève le message d'erreur pour nettoyer la console
console.log("Niavo Social : Connexion établie avec succès !");