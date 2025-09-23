/** @format */

// Replace direct NextAuth invocation with re-export from central auth instance
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
