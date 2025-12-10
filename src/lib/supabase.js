import { createClient } from '@supabase/supabase-js'

// Get these from your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations
export const auth = {
  signIn: (email, password) => 
    supabase.auth.signInWithPassword({ email, password }),
  
  signUp: (email, password, options = {}) => 
    supabase.auth.signUp({ email, password, options }),
  
  signOut: () => 
    supabase.auth.signOut(),
  
  getUser: () => 
    supabase.auth.getUser()
}

// Database operations
export const db = {
  // Profiles
  getProfile: (userId) => 
    supabase.from('profiles').select('*').eq('id', userId).single(),
  
  createProfile: (profile) => 
    supabase.from('profiles').insert(profile),
  
  updateProfile: (userId, updates) => 
    supabase.from('profiles').update(updates).eq('id', userId),
  
  // Questions
  getQuestions: (category = null) => {
    let query = supabase.from('questions').select('*')
    if (category) {
      query = query.eq('category', category)
    }
    return query.order('created_at', { ascending: false })
  },
  
  createQuestion: (question) => 
    supabase.from('questions').insert(question),
  
  updateQuestion: (id, updates) => 
    supabase.from('questions').update(updates).eq('id', id),
  
  deleteQuestion: (id) => 
    supabase.from('questions').delete().eq('id', id),
  
  // Exam Results
  saveExamResult: (result) => 
    supabase.from('exam_results').insert(result),
  
  getExamResults: (userId = null) => {
    let query = supabase.from('exam_results')
      .select(`*, profiles(full_name, school)`)
      .order('created_at', { ascending: false })
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    return query
  }
}
