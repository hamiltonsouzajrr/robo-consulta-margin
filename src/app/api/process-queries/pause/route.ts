import { NextResponse } from 'next/server'
import { pauseProcessing } from '../route'

export async function PUT() {
  try {
    pauseProcessing()
    return NextResponse.json({
      success: true,
      message: 'Processamento pausado com sucesso'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao pausar processamento'
    })
  }
}