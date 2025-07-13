import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell 
} from 'recharts';
import {
  FileText,
  Folder,
  TreePine,
  AlertTriangle,
  TrendingUp,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Download,
  Zap,
  Activity
} from 'lucide-react';
import { BookmarkAnalysis, FolderStatistics, BookmarkTreeNode } from '@/types/importedBookmark';
import { BookmarkAnalyzer } from '@/lib/parsers/bookmarkAnalyzer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BookmarkAnalysisPanelProps {
  analysis: BookmarkAnalysis;
  className?: string;
}

export function BookmarkAnalysisPanel({ analysis, className }: BookmarkAnalysisPanelProps) {
  const [activeView, setActiveView] = useState<'overview' | 'folders' | 'tree' | 'stats'>('overview');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [maxTreeDepth, setMaxTreeDepth] = useState(3);

  // 차트 데이터 준비
  const topFoldersData = analysis.folderStatistics
    .filter(stat => stat.depth >= 0 && stat.bookmarkCount > 0)
    .sort((a, b) => b.totalBookmarks - a.totalBookmarks)
    .slice(0, 10)
    .map(stat => ({
      name: stat.name.length > 15 ? stat.name.substring(0, 15) + '...' : stat.name,
      fullName: stat.name,
      bookmarks: stat.totalBookmarks,
      depth: stat.depth
    }));

  const depthDistributionData = Array.from({ length: analysis.maxDepth + 1 }, (_, depth) => {
    const foldersAtDepth = analysis.folderStatistics.filter(stat => stat.depth === depth).length;
    return {
      depth: `Level ${depth}`,
      folders: foldersAtDepth
    };
  });

  const pieColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

  // 트리 뷰 토글 함수
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // 트리 구조 텍스트 복사
  const copyTreeStructure = () => {
    const treeText = BookmarkAnalyzer.visualizeTree(analysis, maxTreeDepth);
    navigator.clipboard.writeText(treeText);
    toast.success('트리 구조가 클립보드에 복사되었습니다');
  };

  // 분석 결과 다운로드
  const downloadAnalysis = () => {
    const analysisData = {
      ...analysis,
      generatedAt: new Date().toISOString(),
      treeStructureText: BookmarkAnalyzer.visualizeTree(analysis, 5)
    };
    
    const dataStr = JSON.stringify(analysisData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookmark-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('분석 결과가 다운로드되었습니다');
  };

  // 재귀적으로 트리 노드 렌더링
  const renderTreeNode = (node: BookmarkTreeNode, depth: number = 0): JSX.Element | null => {
    if (depth > maxTreeDepth) return null;

    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isFolder = node.type === 'folder';

    return (
      <div key={node.id} className="select-none">
        <div 
          className={cn(
            "flex items-center gap-2 py-1 px-2 rounded hover:bg-accent/50 cursor-pointer",
            depth > 0 && "ml-4"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {/* 확장/축소 아이콘 */}
          {hasChildren && (
            <button className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}
          
          {/* 노드 아이콘 */}
          <div className="w-4 h-4 flex items-center justify-center">
            {isFolder ? (
              <Folder className="w-4 h-4 text-amber-500" />
            ) : (
              <FileText className="w-4 h-4 text-blue-500" />
            )}
          </div>
          
          {/* 노드 이름 */}
          <span className="text-sm truncate flex-1">
            {node.name}
          </span>
          
          {/* 북마크 개수 (폴더인 경우) */}
          {isFolder && node.bookmarkCount !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {node.bookmarkCount}개
            </Badge>
          )}
        </div>
        
        {/* 하위 노드들 */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h3 className="text-lg font-semibold">북마크 분석 결과</h3>
          <Badge variant="outline" className="text-xs">
            처리시간: {analysis.processingTime}ms
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyTreeStructure}>
            <Copy className="h-4 w-4 mr-2" />
            트리 복사
          </Button>
          <Button variant="outline" size="sm" onClick={downloadAnalysis}>
            <Download className="h-4 w-4 mr-2" />
            결과 다운로드
          </Button>
        </div>
      </div>

      {/* 경고사항 */}
      {analysis.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {analysis.warnings.map((warning, index) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">총 북마크</p>
                <p className="text-2xl font-bold">{analysis.totalBookmarks.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">총 폴더</p>
                <p className="text-2xl font-bold">{analysis.totalFolders.toLocaleString()}</p>
              </div>
              <Folder className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">최대 깊이</p>
                <p className="text-2xl font-bold">{analysis.maxDepth}</p>
              </div>
              <TreePine className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">중복 URL</p>
                <p className="text-2xl font-bold text-red-600">{analysis.summary.duplicateUrls}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="folders">폴더 분석</TabsTrigger>
          <TabsTrigger value="tree">트리 구조</TabsTrigger>
          <TabsTrigger value="stats">상세 통계</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 요약 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  주요 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">가장 큰 폴더</span>
                    <div className="text-right">
                      <p className="font-medium">{analysis.summary.largestFolder.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {analysis.summary.largestFolder.totalBookmarks}개 북마크
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">가장 깊은 폴더</span>
                    <div className="text-right">
                      <p className="font-medium">{analysis.summary.deepestFolder.name}</p>
                      <p className="text-xs text-muted-foreground">
                        깊이 {analysis.summary.deepestFolder.depth}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">폴더당 평균 북마크</span>
                    <span className="font-medium">{analysis.summary.averageBookmarksPerFolder}개</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">빈 폴더</span>
                    <span className="font-medium">{analysis.summary.emptyFolders}개</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">최상위 항목</span>
                    <span className="font-medium">{analysis.summary.topLevelItems}개</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">예상 크기</span>
                    <span className="font-medium">{analysis.summary.totalSize}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 상위 폴더 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>상위 폴더별 북마크 수</CardTitle>
              </CardHeader>
              <CardContent>
                {topFoldersData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topFoldersData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value}개 북마크`,
                          props.payload.fullName
                        ]}
                      />
                      <Bar dataKey="bookmarks" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    분석할 폴더가 없습니다
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 폴더 분석 탭 */}
        <TabsContent value="folders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 깊이별 분포 */}
            <Card>
              <CardHeader>
                <CardTitle>깊이별 폴더 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={depthDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="depth" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="folders" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 폴더 상태 파이 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>폴더 상태 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={[
                        { name: '북마크 있음', value: analysis.folderStatistics.filter(s => s.depth >= 0 && !s.isEmpty).length },
                        { name: '빈 폴더', value: analysis.summary.emptyFolders }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 폴더 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>폴더 상세 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {analysis.folderStatistics.filter(stat => stat.depth >= 0).map((folder, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                      style={{ marginLeft: `${folder.depth * 16}px` }}
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="h-4 w-4 text-amber-500" />
                        <div>
                          <p className="font-medium">{folder.name}</p>
                          <p className="text-xs text-muted-foreground">깊이: {folder.depth}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{folder.totalBookmarks}개</p>
                          <p className="text-xs text-muted-foreground">
                            직접: {folder.bookmarkCount}개
                          </p>
                        </div>
                        
                        <div className="flex gap-1">
                          {folder.isEmpty && (
                            <Badge variant="outline" className="text-xs">빈 폴더</Badge>
                          )}
                          {folder.hasSubfolders && (
                            <Badge variant="secondary" className="text-xs">
                              {folder.subfolderCount}개 하위폴더
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 트리 구조 탭 */}
        <TabsContent value="tree" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>북마크 트리 구조</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">최대 깊이:</span>
                  <select 
                    value={maxTreeDepth} 
                    onChange={(e) => setMaxTreeDepth(Number(e.target.value))}
                    className="text-sm border rounded px-2 py-1"
                  >
                    {[1, 2, 3, 4, 5, 10].map(depth => (
                      <option key={depth} value={depth}>{depth}</option>
                    ))}
                  </select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 border rounded-lg p-4">
                <div className="space-y-1">
                  {analysis.treeStructure.map(node => renderTreeNode(node))}
                </div>
                
                {analysis.treeStructure.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    표시할 트리 구조가 없습니다
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 상세 통계 탭 */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">성능 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">처리 시간</span>
                  <span className="text-sm font-medium">{analysis.processingTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">총 노드 수</span>
                  <span className="text-sm font-medium">
                    {analysis.totalBookmarks + analysis.totalFolders}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">평균 처리속도</span>
                  <span className="text-sm font-medium">
                    {Math.round((analysis.totalBookmarks + analysis.totalFolders) / (analysis.processingTime / 1000))} 노드/초
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">구조 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">최대 깊이</span>
                  <span className="text-sm font-medium">{analysis.maxDepth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">평균 깊이</span>
                  <span className="text-sm font-medium">
                    {analysis.folderStatistics.length > 0 
                      ? Math.round(analysis.folderStatistics.filter(s => s.depth >= 0).reduce((sum, s) => sum + s.depth, 0) / analysis.folderStatistics.filter(s => s.depth >= 0).length * 10) / 10
                      : 0
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">북마크/폴더 비율</span>
                  <span className="text-sm font-medium">
                    {analysis.totalFolders > 0 
                      ? Math.round((analysis.totalBookmarks / analysis.totalFolders) * 10) / 10
                      : analysis.totalBookmarks
                    }:1
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">품질 지표</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">중복율</span>
                  <span className="text-sm font-medium">
                    {analysis.totalBookmarks > 0 
                      ? Math.round((analysis.summary.duplicateUrls / analysis.totalBookmarks) * 100 * 10) / 10
                      : 0
                    }%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">빈 폴더율</span>
                  <span className="text-sm font-medium">
                    {analysis.totalFolders > 0 
                      ? Math.round((analysis.summary.emptyFolders / analysis.totalFolders) * 100 * 10) / 10
                      : 0
                    }%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">조직화 점수</span>
                  <span className="text-sm font-medium">
                    {Math.max(0, Math.min(100, Math.round(
                      (analysis.totalFolders > 0 ? 50 : 0) + 
                      (analysis.summary.emptyFolders === 0 ? 25 : Math.max(0, 25 - (analysis.summary.emptyFolders / analysis.totalFolders) * 25)) +
                      (analysis.summary.duplicateUrls === 0 ? 25 : Math.max(0, 25 - (analysis.summary.duplicateUrls / analysis.totalBookmarks) * 25))
                    )))}
                    /100
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 