import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo não fornecido'
      })
    }

    // Processar arquivo
    const buffer = Buffer.from(await file.arrayBuffer())
    let data: any[] = []

    if (file.name.endsWith('.csv')) {
      const text = buffer.toString('utf-8')
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        data.push(row)
      }
    } else if (file.name.endsWith('.xlsx')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      data = XLSX.utils.sheet_to_json(worksheet)
    }

    // Validar estrutura
    const requiredColumns = ['CPF', 'Matricula', 'Orgao']
    const fileColumns = Object.keys(data[0] || {})
    const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col))

    if (missingColumns.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`
      })
    }

    // Filtrar registros válidos
    const validRecords = data.filter(row => row.CPF && row.Matricula && row.Orgao)
    const invalidRecords = data.length - validRecords.length

    return NextResponse.json({
      success: true,
      data: {
        totalRecords: data.length,
        validRecords: validRecords.length,
        invalidRecords,
        records: validRecords.slice(0, 450), // Limitar a 450
        preview: validRecords.slice(0, 5)
      }
    })

  } catch (error) {
    console.error('Erro ao validar arquivo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar arquivo'
    })
  }
}