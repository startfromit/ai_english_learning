import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { getGitInfo } from '@/lib/git-info'

export async function GET(request: NextRequest) {
  try {
    // 检查管理员权限
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 获取构建时的 Git 信息
    const gitInfo = getGitInfo()

    return NextResponse.json(gitInfo)

  } catch (error) {
    console.error('Error fetching git info:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch git information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 