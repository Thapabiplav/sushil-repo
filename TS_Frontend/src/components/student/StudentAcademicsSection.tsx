import { useEffect, useState } from 'react';
import { User } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Trophy, TrendingUp, BookOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { apiFetch } from '../../lib/api';

interface StudentAcademicsSectionProps {
  user: User;
}

interface ExamResult {
  subject: string;
  fullMarks: number;
  obtained: number;
  grade: string;
}

interface ExamEntry {
  exam: string;
  date: string;
  results: ExamResult[];
  totalObtained: number;
  totalMarks: number;
  percentage: number;
  rank: number;
}

interface SubjectPerformance {
  subject: string;
  average: number;
  trend: 'up' | 'down';
  exams: { name: string; marks: number; outOf: number }[];
}

interface AcademicsResponse {
  exams: ExamEntry[];
  subjectPerformance: SubjectPerformance[];
}

export function StudentAcademicsSection({ user }: StudentAcademicsSectionProps) {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [data, setData] = useState<AcademicsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    apiFetch<AcademicsResponse>(`/students/${user.id}/academics`)
      .then((response) => {
        // Normalize exam results - ensure results is always an array
        const normalizedResponse: AcademicsResponse = {
          ...response,
          exams: response.exams.map((exam) => {
            let results: ExamResult[] = [];
            if (exam.results) {
              if (typeof exam.results === 'string') {
                try {
                  results = JSON.parse(exam.results);
                } catch {
                  results = [];
                }
              } else if (Array.isArray(exam.results)) {
                results = exam.results;
              }
            }
            return {
              ...exam,
              results,
            };
          }),
        };
        setData(normalizedResponse);
        if (normalizedResponse.exams.length && !selectedExam) {
          setSelectedExam(normalizedResponse.exams[0].exam);
        }
        if (normalizedResponse.subjectPerformance.length && !selectedSubject) {
          setSelectedSubject(normalizedResponse.subjectPerformance[0].subject);
        }
      })
      .catch((err) => setError(err.message ?? 'Failed to load academics'))
      .finally(() => setIsLoading(false));
  }, [user.id]);

  useEffect(() => {
    if (data?.exams.length && !selectedExam) {
      setSelectedExam(data.exams[0].exam);
    }
    if (data?.subjectPerformance.length && !selectedSubject) {
      setSelectedSubject(data.subjectPerformance[0].subject);
    }
  }, [data]);

  const currentExam = data?.exams.find((e) => e.exam === selectedExam);
  const currentSubject = data?.subjectPerformance.find((s) => s.subject === selectedSubject);

  return (
    <div className="space-y-4">
      {/* Exam Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-green-600" />
            Exam Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Exam Selector */}
          {isLoading && <p className="text-sm text-gray-500">Loading exams...</p>}
          {!isLoading && data?.exams.length && (
            <Select value={selectedExam ?? undefined} onValueChange={setSelectedExam}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.exams.map((exam) => (
                  <SelectItem key={exam.exam} value={exam.exam}>
                    {exam.exam}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {error}
            </div>
          )}

          {currentExam && (
            <>
              {/* Overall Performance */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Total Marks</p>
                    <p className="text-2xl text-gray-900">
                      {currentExam.totalObtained}/{currentExam.totalMarks}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Percentage</p>
                    <p className="text-2xl text-green-600">{currentExam.percentage}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-green-200">
                  <span className="text-sm text-gray-600">Class Rank</span>
                  <span className="text-green-700 flex items-center gap-1">
                    <Trophy className="size-4" />
                    Rank {currentExam.rank}
                  </span>
                </div>
              </div>

              {/* Subject-wise Results */}
              <div className="space-y-2">
                <h3 className="text-gray-900">Subject-wise Marks</h3>
                {(Array.isArray(currentExam.results) ? currentExam.results : []).map((result, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-900">{result.subject}</span>
                      <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded">
                        {result.grade}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(result.obtained / result.fullMarks) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700">
                        {result.obtained}/{result.fullMarks}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Subject-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-green-600" />
            Subject-wise Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject Selector */}
          {!isLoading && data?.subjectPerformance.length && (
            <Select value={selectedSubject ?? undefined} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.subjectPerformance.map((subject) => (
                  <SelectItem key={subject.subject} value={subject.subject}>
                    {subject.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {currentSubject && (
            <>
              {/* Average Score */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-3xl text-blue-600">{currentSubject.average}%</p>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                    currentSubject.trend === 'up' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <TrendingUp className={`size-4 ${
                      currentSubject.trend === 'down' ? 'rotate-180' : ''
                    }`} />
                    {currentSubject.trend === 'up' ? 'Improving' : 'Needs Attention'}
                  </div>
                </div>
              </div>

              {/* Performance Timeline */}
              <div className="space-y-2">
                <h3 className="text-gray-900">Performance Timeline</h3>
                {currentSubject.exams.map((exam, idx) => {
                  const percentage = (exam.marks / exam.outOf) * 100;
                  return (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-900">{exam.name}</span>
                        <span className="text-sm text-gray-600">
                          {exam.marks}/{exam.outOf}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              percentage >= 90 ? 'bg-green-600' :
                              percentage >= 75 ? 'bg-blue-600' :
                              percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-700">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overall Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border text-center">
                  <p className="text-sm text-gray-600">Best</p>
                  <p className="text-xl text-green-600">
                    {Math.max(...currentSubject.exams.map(e => (e.marks / e.outOf) * 100)).toFixed(0)}%
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border text-center">
                  <p className="text-sm text-gray-600">Average</p>
                  <p className="text-xl text-blue-600">{currentSubject.average}%</p>
                </div>
                <div className="p-3 bg-white rounded-lg border text-center">
                  <p className="text-sm text-gray-600">Tests</p>
                  <p className="text-xl text-gray-900">{currentSubject.exams.length}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
