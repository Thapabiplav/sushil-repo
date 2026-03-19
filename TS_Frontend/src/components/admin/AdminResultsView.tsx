import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FileText, Download, Eye, TrendingUp, TrendingDown } from 'lucide-react';

const mockResults = [
  { class: 'Class 10A', exam: 'Mid-Term 2025', avgScore: 82, totalStudents: 35, published: true },
  { class: 'Class 10B', exam: 'Mid-Term 2025', avgScore: 78, totalStudents: 32, published: true },
  { class: 'Class 9A', exam: 'Mid-Term 2025', avgScore: 85, totalStudents: 38, published: true },
  { class: 'Class 9B', exam: 'Mid-Term 2025', avgScore: 80, totalStudents: 30, published: false },
];

const topPerformers = [
  { name: 'Alice Johnson', class: 'Class 10A', score: 98, rank: 1 },
  { name: 'Bob Wilson', class: 'Class 10A', score: 96, rank: 2 },
  { name: 'Charlie Davis', class: 'Class 9A', score: 95, rank: 3 },
  { name: 'Diana Evans', class: 'Class 10B', score: 94, rank: 4 },
  { name: 'Eva Martinez', class: 'Class 9A', score: 93, rank: 5 },
];

export function AdminResultsView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h3>Results Management</h3>
          <p className="text-sm text-gray-600 mt-1">View and manage exam results</p>
        </div>
        <div className="flex gap-2">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mid-term">Mid-Term 2025</SelectItem>
              <SelectItem value="final">Final 2024</SelectItem>
              <SelectItem value="quarterly">Quarterly 2024</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="size-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <FileText className="size-8 text-purple-600" />
            <TrendingUp className="size-5 text-green-600" />
          </div>
          <p className="text-gray-600 text-sm">Overall Average</p>
          <p className="text-gray-900">81.25%</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <FileText className="size-8 text-blue-600" />
          </div>
          <p className="text-gray-600 text-sm">Total Students</p>
          <p className="text-gray-900">135</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <FileText className="size-8 text-green-600" />
          </div>
          <p className="text-gray-600 text-sm">Pass Rate</p>
          <p className="text-gray-900">95.6%</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <FileText className="size-8 text-orange-600" />
          </div>
          <p className="text-gray-600 text-sm">Published Results</p>
          <p className="text-gray-900">3 / 4</p>
        </Card>
      </div>

      {/* Class-wise Results */}
      <Card className="p-6">
        <h3 className="mb-4">Class-wise Results</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-700">Class</th>
                <th className="text-left py-3 px-4 text-sm text-gray-700">Exam</th>
                <th className="text-left py-3 px-4 text-sm text-gray-700">Avg Score</th>
                <th className="text-left py-3 px-4 text-sm text-gray-700">Students</th>
                <th className="text-left py-3 px-4 text-sm text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockResults.map((result, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">{result.class}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{result.exam}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{result.avgScore}%</span>
                      {result.avgScore >= 80 ? (
                        <TrendingUp className="size-4 text-green-600" />
                      ) : (
                        <TrendingDown className="size-4 text-orange-600" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{result.totalStudents}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${
                      result.published ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {result.published ? 'Published' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Performers */}
      <Card className="p-6">
        <h3 className="mb-4">Top Performers</h3>
        <div className="space-y-3">
          {topPerformers.map((student) => (
            <div key={student.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`size-10 rounded-full flex items-center justify-center ${
                  student.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                  student.rank === 2 ? 'bg-gray-200 text-gray-700' :
                  student.rank === 3 ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  #{student.rank}
                </div>
                <div>
                  <p className="text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-600">{student.class}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-900">{student.score}%</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
