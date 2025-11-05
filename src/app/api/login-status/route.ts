import { NextRequest, NextResponse } from 'next/server'
import { isLoggedIn } from '../start-login/route'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    return NextResponse.json({
      loggedIn: isLoggedIn,
      message: isLoggedIn ? 'Usuário está logado' : 'Login necessário'
    })
  } catch (error) {
    console.error('Erro ao verificar status do login:', error)
    
    return NextResponse.json({
      loggedIn: false,
      error: 'Erro ao verificar status do login'
    })
  }
}