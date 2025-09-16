'use client';

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Users, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import Button from "@/app/components/Button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import toast from "react-hot-toast";
import { EmployeeQuestions } from "@/app/types";
import { EQuestions } from "@/app/services/api";

type RespMap = Record<string, string>;
type BoolMap = Record<string, boolean>;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<EmployeeQuestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [savedValues, setSavedValues] = useState<RespMap>({});
  const [draftValues, setDraftValues] = useState<RespMap>({});
  const [savingByKey, setSavingByKey] = useState<BoolMap>({});

  const qKey = (qId: string | number | undefined) => String(qId ?? "");

  const getInitialResp = (q: EmployeeQuestions) => {
    const v =
      (q as any).answer ??
      (q as any).responseValue ??
      (q as any).userResponse ??
      (typeof (q as any).response === "string" ? (q as any).response : "");
    return (v ?? "").toString();
  };

  const isTextType = useCallback(
    (q: EmployeeQuestions) => String(q.responseType ?? "").toLowerCase() === "text",
    []
  );

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const storedUser = localStorage.getItem("user");
      if (!storedUser) throw new Error("No user in localStorage");
      const user = JSON.parse(storedUser);
      const userId = user.id;

      const resp = await EQuestions.getEmployeeQuestions(userId, 0);
      const list: EmployeeQuestions[] = Array.isArray(resp?.commonListDto)
        ? resp.commonListDto
        : [];

      setQuestions(list);
      // console.log(list.map(q => ({ id: q.id, completedflag: q.completedFlag, response: q.response }))); //debug log

// Initialize saved and draft values
      const initSaved: RespMap = {};
      const initDraft: RespMap = {};
      for (const q of list) {
        const key = qKey(q.id);
        const v = getInitialResp(q);
        initSaved[key] = v;
        initDraft[key] = v;
      }
      setSavedValues(initSaved);
      setDraftValues(initDraft);
    } catch (e) {
      console.error("Error fetching Employee Questions", e);
      setError("Failed to load Employee Questions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (user.role !== "employee") {
      router.push("/");
      return;
    }
    void loadQuestions();
  }, [user, router, loadQuestions]);

  const saveQuestionResponse = useCallback(
    async (q: EmployeeQuestions, value: string) => {
      const key = qKey(q.id);
      try {
        setSavingByKey((s) => ({ ...s, [key]: true }));
        await EQuestions.saveResponse(q.id, value);
        setSavedValues((sv) => ({ ...sv, [key]: value }));
        toast.success("Response saved");
      } catch (e: any) {
        toast.error(e?.response?.data?.message ?? "Failed to save response");
        setDraftValues((dv) => ({ ...dv, [key]: savedValues[key] ?? "" }));
      } finally {
        setSavingByKey((s) => ({ ...s, [key]: false }));
      }
    },
    [savedValues]
  );

  const onChangeDraft = useCallback((key: string, v: string) => {
    setDraftValues((dv) => ({ ...dv, [key]: v }));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Could not load</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => loadQuestions()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  // Total questions
  const totalQuestions = questions.length;

  // Completed questions 
  const completedQuestions = questions.filter(q => q.completedFlag === true).length;

  // Pending questions = total - completed
  const pendingQuestions = totalQuestions - completedQuestions;


  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
              <p className="text-2xl font-bold">{totalQuestions}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Users size={20} className="text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Answered</p>
              <p className="text-2xl font-bold text-green-500">{completedQuestions}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle size={20} className="text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-red-500">{pendingQuestions}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-full">
              <AlertCircle size={20} className="text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Questions Table */}
      <Card>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">No questions found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((q) => {
                  const key = qKey(q.id);
                  const draft = draftValues[key] ?? "";
                  const saved = savedValues[key] ?? "";
                  const saving = savingByKey[key] === true;
                  const questionText = (q as any).questions ?? (q as any).question ?? `Q${q.id}`;

                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium">
                        {questionText}
                        <div className="text-xs text-muted-foreground">{isTextType(q) ? "Text" : "Yes/No"}</div>
                      </TableCell>
                      <TableCell className="min-w-[260px]">
                        {isTextType(q) ? (
                          <input
                            type="text"
                            className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                            placeholder="Type response and leave the field"
                            value={draft}
                            onChange={(e) => onChangeDraft(key, e.target.value)}
                            onBlur={(e) => {
                              const newVal = e.target.value.trim();
                              if (saving || newVal === saved) return;
                              void saveQuestionResponse(q, newVal);
                            }}
                            disabled={saving}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={(saved || "").toLowerCase() === "yes" ? "default" : "outline"}
                              disabled={saving}
                              onClick={() => {
                                onChangeDraft(key, "YES");
                                void saveQuestionResponse(q, "YES");
                              }}
                            >
                              Yes
                            </Button>
                            <Button
                              type="button"
                              variant={(saved || "").toLowerCase() === "no" ? "default" : "outline"}
                              disabled={saving}
                              onClick={() => {
                                onChangeDraft(key, "NO");
                                void saveQuestionResponse(q, "NO");
                              }}
                            >
                              No
                            </Button>
                            {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
