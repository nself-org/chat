'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataRetentionSettings } from '@/components/compliance';

export default function RetentionPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/compliance">
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Compliance
          </Button>
        </Link>
      </div>
      <DataRetentionSettings />
    </div>
  );
}
