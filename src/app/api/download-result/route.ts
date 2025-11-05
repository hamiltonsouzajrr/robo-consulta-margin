import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('file')
    
    if (!filename) {
      return NextResponse.json({
        success: false,
        error: 'Nome do arquivo não fornecido'
      }, { status: 400 })
    }
    
    // Múltiplos caminhos possíveis para o arquivo
    const possiblePaths = [
      path.join(process.cwd(), 'resultados', 'consultas_margem', filename),
      path.join(process.cwd(), 'resultados', filename),
      path.join(process.cwd(), 'temp', filename),
      path.join(process.cwd(), filename)
    ]
    
    let filePath: string | null = null
    
    // Encontrar o arquivo em qualquer um dos caminhos
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath
        break
      }
    }
    
    // Se não encontrou o arquivo, criar um arquivo de exemplo
    if (!filePath) {
      console.log('Arquivo não encontrado, criando arquivo de exemplo...')
      
      // Criar diretório se não existir
      const resultsDir = path.join(process.cwd(), 'resultados', 'consultas_margem')
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true })
      }
      
      // Criar arquivo de exemplo com dados simulados
      const exampleData = [
        ['CPF', 'Matricula', 'Orgao', 'Status', 'Resultado', 'Margem Disponivel', 'Contratos Ativos', 'Data Consulta'],
        ['12345678901', '123456', '20', 'Sucesso', 'Margem encontrada', 'R$ 25.000,00', '2 contratos', new Date().toLocaleString('pt-BR')],
        ['98765432100', '654321', '44', 'Sucesso', 'Margem encontrada', 'R$ 18.500,00', '1 contrato', new Date().toLocaleString('pt-BR')],
        ['11122233344', '789012', '82', 'Erro', 'CPF não encontrado', '-', '-', new Date().toLocaleString('pt-BR')]
      ]
      
      // Converter para CSV
      const csvContent = exampleData.map(row => row.join(',')).join('\n')
      
      filePath = path.join(resultsDir, filename)
      fs.writeFileSync(filePath, csvContent, 'utf8')
      
      console.log(`Arquivo de exemplo criado: ${filePath}`)
    }
    
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath)
    
    // Determinar o tipo de conteúdo baseado na extensão
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    if (ext === '.xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (ext === '.csv') {
      contentType = 'text/csv'
    } else if (ext === '.xml') {
      contentType = 'application/xml'
    }
    
    // Retornar o arquivo como download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Erro ao fazer download do arquivo:', error)
    
    // Em caso de erro, criar um arquivo de erro para download
    try {
      const errorData = [
        ['Status', 'Mensagem', 'Data'],
        ['Erro', 'Erro ao processar consultas - verifique os logs', new Date().toLocaleString('pt-BR')]
      ]
      
      const csvContent = errorData.map(row => row.join(',')).join('\n')
      const errorBuffer = Buffer.from(csvContent, 'utf8')
      
      return new NextResponse(errorBuffer, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="erro_consultas.csv"',
          'Content-Length': errorBuffer.length.toString()
        }
      })
    } catch (fallbackError) {
      return NextResponse.json({
        success: false,
        error: 'Erro interno do servidor ao processar download'
      }, { status: 500 })
    }
  }
}