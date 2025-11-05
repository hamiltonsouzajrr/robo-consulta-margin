import { NextResponse } from 'next/server'

export async function PUT() {
  try {
    // Simular confirmação de login
    return NextResponse.json({
      success: true,
      message: 'Login confirmado com sucesso'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao confirmar login'
    })
  }
}