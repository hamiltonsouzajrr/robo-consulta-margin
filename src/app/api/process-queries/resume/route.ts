import { NextResponse } from 'next/server'
import { resumeProcessing } from '../route'

export async function PUT() {
  try {
    resumeProcessing()
    return NextResponse.json({
      success: true,
      message: 'Processamento retomado com sucesso'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao retomar processamento'
    })
  }
}