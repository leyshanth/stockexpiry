"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, X } from "lucide-react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear
}: DateRangePickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium mb-2 block">Expiry Date Range</Label>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="start-date" className="text-xs">From</Label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex-1">
            <Label htmlFor="end-date" className="text-xs">To</Label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="mt-4"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 