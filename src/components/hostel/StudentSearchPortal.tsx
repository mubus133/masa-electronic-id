"use client";

import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import type { Student } from "@/lib/types";

interface StudentSearchPortalProps {
  onSelectStudent: (student: Student) => void;
  assignedHostelName?: string | null;
}

export function StudentSearchPortal({ onSelectStudent, assignedHostelName }: StudentSearchPortalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/hostel/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#142B4A]">Hostel Entry Verification</h2>
        <p className="text-xs text-slate-500 mt-1">
          {assignedHostelName ? `Assigned Station: ${assignedHostelName}` : "All Hostels Verification"}
          &bull; Live Server-side Status Check
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-5 w-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter student registration number (e.g. IMASA-1001) or full name..."
              className="w-full pl-11 pr-4 py-3 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#0F766E] shadow-sm font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-[#0F766E] hover:bg-[#0B5C55] text-white text-sm font-bold rounded-xl shadow transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Verify Student
          </button>
        </div>
      </form>

      {/* Results Dropdown / List */}
      {searched && (
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {results.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No matching students found. Please verify spelling or registration number.
            </div>
          ) : (
            results.map((student) => (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-300 shrink-0">
                    {student.photograph_url ? (
                      <img src={student.photograph_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[#142B4A] text-white flex items-center justify-center font-bold">
                        {student.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#142B4A]">{student.full_name}</h4>
                    <p className="font-mono text-xs text-[#0F766E] font-semibold">{student.registration_number}</p>
                    <p className="text-[11px] text-slate-400">
                      Hostel: {student.hostel_name || "Unassigned"} &bull; Class: {student.class_group || "Group A"}
                    </p>
                  </div>
                </div>
                <button className="px-3.5 py-1.5 rounded-lg bg-[#142B4A] text-white text-xs font-semibold hover:bg-[#0D1E35] transition-colors">
                  Inspect &rarr;
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
