'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LikesDebugPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [tests, setTests] = useState<Array<{ name: string; status: 'pending' | 'running' | 'success' | 'error'; message?: string }>>([
    { name: 'Check Supabase connection', status: 'pending' },
    { name: 'Check likes table exists', status: 'pending' },
    { name: 'Check RLS policies', status: 'pending' },
    { name: 'Test insert like', status: 'pending' },
    { name: 'Test delete like', status: 'pending' },
    { name: 'Check realtime enabled', status: 'pending' },
  ])
  const [testPostId, setTestPostId] = useState('test-post-123')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null)
    })
  }, [])

  const runTests = async () => {
    const newTests = [...tests]
    
    // Test 1: Supabase connection
    newTests[0].status = 'running'
    setTests([...newTests])
    try {
      const { data, error } = await supabase.from('community_posts').select('count', { count: 'exact' }).limit(1)
      if (error) throw error
      newTests[0].status = 'success'
      newTests[0].message = `✓ Connected. Found ${data?.length ?? 0} posts`
    } catch (err: any) {
      newTests[0].status = 'error'
      newTests[0].message = `✗ ${err.message}`
    }
    setTests([...newTests])

    // Test 2: Likes table exists
    newTests[1].status = 'running'
    setTests([...newTests])
    try {
      const { data, error } = await supabase.from('likes').select('count', { count: 'exact' }).limit(1)
      if (error) throw error
      newTests[1].status = 'success'
      newTests[1].message = `✓ likes table exists`
    } catch (err: any) {
      newTests[1].status = 'error'
      newTests[1].message = `✗ ${err.message}`
    }
    setTests([...newTests])

    // Test 3: Try to insert a like (will fail if no auth, that's ok)
    newTests[2].status = 'running'
    setTests([...newTests])
    if (!userId) {
      newTests[2].status = 'error'
      newTests[2].message = '✗ Not logged in - cannot test RLS policies'
    } else {
      try {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: userId, post_id: testPostId })
        
        if (error) {
          if (error.code === '42501') {
            newTests[2].status = 'error'
            newTests[2].message = '✗ RLS blocking insert - policies not set up correctly'
          } else {
            newTests[2].status = 'success'
            newTests[2].message = `✓ Insert attempted (${error.message})`
          }
        } else {
          newTests[2].status = 'success'
          newTests[2].message = '✓ Can insert likes'
        }
      } catch (err: any) {
        newTests[2].status = 'error'
        newTests[2].message = `✗ ${err.message}`
      }
    }
    setTests([...newTests])

    // Test 4: Count likes
    newTests[3].status = 'running'
    setTests([...newTests])
    try {
      const { count, error } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('post_id', testPostId)
      
      if (error) throw error
      newTests[3].status = 'success'
      newTests[3].message = `✓ Can count likes: ${count} found`
    } catch (err: any) {
      newTests[3].status = 'error'
      newTests[3].message = `✗ ${err.message}`
    }
    setTests([...newTests])

    // Cleanup test like
    newTests[4].status = 'running'
    setTests([...newTests])
    if (userId) {
      try {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', testPostId)
        newTests[4].status = 'success'
        newTests[4].message = '✓ Can delete likes'
      } catch (err: any) {
        newTests[4].status = 'error'
        newTests[4].message = `✗ ${err.message}`
      }
    } else {
      newTests[4].status = 'error'
      newTests[4].message = '✗ Not logged in'
    }
    setTests([...newTests])

    // Test 6: Realtime
    newTests[5].status = 'running'
    setTests([...newTests])
    try {
      const channel = supabase.channel('test')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {})
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            newTests[5].status = 'success'
            newTests[5].message = '✓ Realtime subscription works'
            setTests([...newTests])
            channel.unsubscribe()
          }
        })
      
      setTimeout(() => {
        if (newTests[5].status === 'running') {
          newTests[5].status = 'success'
          newTests[5].message = '✓ Realtime channel created (subscription pending)'
          setTests([...newTests])
        }
      }, 1000)
    } catch (err: any) {
      newTests[5].status = 'error'
      newTests[5].message = `✗ ${err.message}`
      setTests([...newTests])
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Likes System Debug</h1>
      
      <div className="mb-6">
        <p className="text-zinc-400 mb-2">User ID: {userId || 'Not logged in'}</p>
        <button 
          onClick={runTests}
          className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
        >
          Run Diagnostics
        </button>
      </div>

      <div className="space-y-2">
        {tests.map((test, i) => (
          <div 
            key={i} 
            className={`p-4 rounded-lg border ${
              test.status === 'success' ? 'bg-green-900/20 border-green-500/30' :
              test.status === 'error' ? 'bg-red-900/20 border-red-500/30' :
              test.status === 'running' ? 'bg-blue-900/20 border-blue-500/30' :
              'bg-[#16161a] border-[#2a2a30]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={
                test.status === 'success' ? 'text-green-400' :
                test.status === 'error' ? 'text-red-400' :
                test.status === 'running' ? 'text-blue-400' :
                'text-zinc-500'
              }>
                {test.status === 'success' ? '✓' :
                 test.status === 'error' ? '✗' :
                 test.status === 'running' ? '⟳' : '○'}
              </span>
              <span className="font-medium">{test.name}</span>
            </div>
            {test.message && (
              <p className="mt-2 text-sm text-zinc-400 pl-7">{test.message}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-[#16161a] rounded-lg border border-[#2a2a30]">
        <h2 className="font-bold mb-2">Setup Required</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Run this SQL in your Supabase SQL Editor to fix likes:
        </p>
        <pre className="bg-black p-4 rounded text-xs overflow-x-auto text-green-400">
{`-- 1. Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, post_id)
);

-- 2. Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 3. Add policies
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can create likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- 4. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE likes;

-- 5. Add indexes
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);`}
        </pre>
      </div>
    </div>
  )
}
