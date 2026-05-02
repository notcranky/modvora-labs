import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Password reset is temporarily unavailable.' },
        { status: 503 }
      )
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      )
    }

    // For now, we'll generate a reset token and return it
    // In production, you'd send an email with a reset link
    const { data, error } = await supabaseServer.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://modvoralabs.com'}/reset-password`,
      },
    })

    if (error) {
      console.error('[reset-password] error:', error)
      // Don't reveal if email exists or not (security)
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, you will receive reset instructions.' }
      )
    }

    // In a real app, you'd send this via email
    // For now, we return a mock success message
    return NextResponse.json({
      success: true,
      message: 'Password reset instructions sent to your email.',
      // Only in dev: include the reset link for testing
      ...(process.env.NODE_ENV !== 'production' && data?.properties?.action_link
        ? { devLink: data.properties.action_link }
        : {}),
    })
  } catch (error) {
    console.error('[reset-password] error:', error)
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    )
  }
}

// Update password after reset
export async function PUT(req: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Password reset is temporarily unavailable.' },
        { status: 503 }
      )
    }

    const { token, newPassword } = await req.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Verify the token and update password
    const { data: verifyData, error: verifyError } = await supabaseServer.auth.verifyOtp({
      type: 'recovery',
      token,
      new_password: newPassword,
    })

    if (verifyError) {
      console.error('[reset-password verify] error:', verifyError)
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now sign in.',
    })
  } catch (error) {
    console.error('[reset-password verify] error:', error)
    return NextResponse.json(
      { error: 'Failed to update password. Please try again.' },
      { status: 500 }
    )
  }
}
