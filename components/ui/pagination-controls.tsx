'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  disabled?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: PaginationControlsProps) {
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const handleFirstPage = () => onPageChange(1);
  const handlePreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const handleLastPage = () => onPageChange(totalPages);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
      {/* Records info */}
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <span className="hidden sm:inline">Mostrando</span>
        <span className="font-semibold text-purple-600">
          {startRecord}-{endRecord}
        </span>
        <span>de</span>
        <span className="font-semibold text-purple-600">{totalRecords}</span>
        <span className="hidden sm:inline">registros</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-gray-700 whitespace-nowrap">
            Registros por página:
          </label>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={disabled}
          >
            <SelectTrigger
              id="page-size"
              className="h-9 w-[100px] focus:ring-purple-500 focus:border-purple-500"
              aria-label="Seleccionar tamaño de página"
              disabled={disabled}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-700 mr-2">
            Página <span className="font-semibold text-purple-600">{currentPage}</span> de{' '}
            <span className="font-semibold text-purple-600">{totalPages}</span>
          </span>

          <button
            onClick={handleFirstPage}
            disabled={currentPage === 1 || disabled}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Primera página"
            title="Primera página"
          >
            <ChevronsLeft className="h-5 w-5" />
          </button>

          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || disabled}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Página anterior"
            title="Página anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages || disabled}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Página siguiente"
            title="Página siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            onClick={handleLastPage}
            disabled={currentPage === totalPages || disabled}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Última página"
            title="Última página"
          >
            <ChevronsRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
