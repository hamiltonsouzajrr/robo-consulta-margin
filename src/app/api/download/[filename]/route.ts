import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
): Promise<NextResponse> {
  try {
    const filename = params.filename
    
    // Verificar se o arquivo existe no diretório de resultados
    const resultsDir = path.join(process.cwd(), 'resultados', 'consultas_margem')
    const filePath = path.join(resultsDir, filename)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo não encontrado'
      }, { status: 404 })
    }
    
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath)
    
    // Retornar o arquivo para download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })
    
  } catch (error) {
    console.error('Erro ao fazer download do arquivo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}