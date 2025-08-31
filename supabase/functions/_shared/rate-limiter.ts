/**
 * Reusable rate limiting utility for Supabase Edge Functions
 * 
 * Usage:
 * ```typescript
 * import { RateLimiter } from "../_shared/rate-limiter.ts";
 * 
 * const rateLimiter = new RateLimiter(supabase);
 * const result = await rateLimiter.checkLimit(req, user_id, { limit: 100 });
 * 
 * if (!result.allowed) {
 *   return new Response(JSON.stringify({
 *     error: "Rate limit exceeded"
 *   }), { status: 429 });
 * }
 * ```
 */

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  reset_time: string;
  remaining: number;
  retry_after?: number;
}

export interface RateLimitConfig {
  limit?: number;
  window?: string; // Currently only supports '1m' (1 minute)
  skip_authenticated?: boolean;
  custom_key?: string; // Custom key for specific rate limiting
}

export class RateLimiter {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Get client IP address from request headers
   */
  private getClientIP(request: Request): string {
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (cfConnectingIP) return cfConnectingIP.split(',')[0].trim();
    if (xRealIP) return xRealIP;
    if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
    
    return '127.0.0.1';
  }

  /**
   * Check rate limit for a request
   */
  async checkLimit(
    request: Request,
    user_id?: string,
    config: RateLimitConfig = {}
  ): Promise<RateLimitResult> {
    const { 
      limit = 100, 
      skip_authenticated = false,
      custom_key 
    } = config;
    
    // Skip rate limiting for authenticated users if configured
    if (skip_authenticated && user_id) {
      return {
        allowed: true,
        count: 0,
        limit: limit,
        remaining: limit,
        reset_time: new Date(Date.now() + 60000).toISOString()
      };
    }

    const clientIP = this.getClientIP(request);
    
    // Use custom key if provided, otherwise use user_id or IP
    const identifierKey = custom_key || user_id || clientIP;
    
    console.log(`[RateLimiter] Checking limit for ${identifierKey} (limit: ${limit})`);

    try {
      const { data, error } = await this.supabase.rpc('check_rate_limit', {
        p_user_id: user_id || null,
        p_ip_address: user_id ? null : clientIP,
        p_limit: limit
      });

      if (error) {
        console.error('[RateLimiter] Database error:', error);
        throw new Error(`Rate limit check failed: ${error.message}`);
      }

      const result: RateLimitResult = data;
      
      console.log(`[RateLimiter] Result:`, {
        identifier: identifierKey,
        allowed: result.allowed,
        count: result.count,
        remaining: result.remaining
      });

      return result;

    } catch (error) {
      console.error('[RateLimiter] Error:', error);
      // In case of error, allow the request but log the issue
      return {
        allowed: true,
        count: 0,
        limit: limit,
        remaining: limit,
        reset_time: new Date(Date.now() + 60000).toISOString()
      };
    }
  }

  /**
   * Create rate limit headers for HTTP response
   */
  getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": new Date(result.reset_time).getTime().toString()
    };

    if (result.retry_after) {
      headers["Retry-After"] = Math.ceil(result.retry_after).toString();
    }

    return headers;
  }

  /**
   * Create a rate limit exceeded response
   */
  createRateLimitResponse(
    result: RateLimitResult, 
    corsHeaders: Record<string, string> = {}
  ): Response {
    return new Response(JSON.stringify({
      success: false,
      error: "Rate limit exceeded",
      message: `API rate limit exceeded. Maximum ${result.limit} requests per minute allowed.`,
      rate_limit: {
        limit: result.limit,
        remaining: 0,
        reset_time: result.reset_time,
        retry_after: result.retry_after
      },
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        ...this.getRateLimitHeaders(result)
      },
      status: 429,
    });
  }

  /**
   * Middleware function that can be used in Edge Functions
   */
  async middleware(
    request: Request,
    user_id?: string,
    config: RateLimitConfig = {}
  ): Promise<{ allowed: boolean; response?: Response; result: RateLimitResult }> {
    const result = await this.checkLimit(request, user_id, config);
    
    if (!result.allowed) {
      return {
        allowed: false,
        response: this.createRateLimitResponse(result),
        result
      };
    }

    return {
      allowed: true,
      result
    };
  }
}

/**
 * Convenience function to create a rate limiter instance
 */
export function createRateLimiter(supabaseClient: any): RateLimiter {
  return new RateLimiter(supabaseClient);
}