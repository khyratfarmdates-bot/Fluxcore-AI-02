import { ExecutionResult, IntegrationAccount } from './types';

import { safeStringify } from '../lib/safe-stringify';

/**
 * Unified Social API Layer
 * Implements real fetch request structures for platform APIs.
 */
export class SocialAPILayer {

  /**
   * Internal helper to handle API requests with unified error parsing and token validation
   */
  private static async apiRequest(
    url: string,
    method: string,
    body: any,
    account: IntegrationAccount
  ): Promise<ExecutionResult> {
    const token = account.credentials?.accessToken || account.credentials?.apiKey;
    
    if (!token) {
      return { 
        success: false, 
        error: `MISSING_CREDENTIALS: No valid authorization found for ${account.provider}.` 
      };
    }

    // Check account status before attempting
    if (account.status !== 'connected') {
      return { 
        success: false, 
        error: `INVALID_ACCOUNT_STATUS: Account is currently ${account.status}.` 
      };
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Note: Some platforms use custom headers (e.g., X-API-Key)
          ...(account.credentials.apiKey ? { 'X-API-Key': account.credentials.apiKey } : {})
        },
        body: method !== 'GET' ? safeStringify(body) : undefined
      });

      // Handle specific HTTP error categories
      if (response.status === 401) {
        return { success: false, error: 'UNAUTHORIZED: Authentication failed or token expired.' };
      }

      if (response.status === 403) {
        return { success: false, error: 'FORBIDDEN: Insufficient permissions for this action.' };
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        return { 
          success: false, 
          error: 'RATE_LIMITED: Daily quota exceeded.',
          rateLimitRest: retryAfter ? new Date(Date.now() + parseInt(retryAfter) * 1000) : undefined
        };
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: `PLATFORM_ERROR: ${response.status} ${response.statusText}`,
          data: errorBody
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      return { 
        success: false, 
        error: `NETWORK_FAILURE: Unable to reach ${account.provider} API. ${error.message}` 
      };
    }
  }
  
  static async publishToX(content: string, mediaUrls: string[], account: IntegrationAccount): Promise<ExecutionResult> {
    return this.apiRequest(
      'https://api.twitter.com/2/tweets',
      'POST',
      { 
        text: content,
        ...(mediaUrls.length > 0 ? { media: { media_ids: mediaUrls } } : {})
      },
      account
    );
  }

  static async publishToLinkedIn(content: string, mediaUrls: string[], account: IntegrationAccount): Promise<ExecutionResult> {
    // Simplified LinkedIn v2 ugcPosts structure
    return this.apiRequest(
      'https://api.linkedin.com/v2/ugcPosts',
      'POST',
      {
        author: `urn:li:person:${account.id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: mediaUrls.length > 0 ? 'IMAGE' : 'NONE',
            media: mediaUrls.map(url => ({ status: 'READY', originalContext: url }))
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      },
      account
    );
  }

  static async publishToInstagram(content: string, mediaUrls: string[], account: IntegrationAccount): Promise<ExecutionResult> {
    if (!mediaUrls || mediaUrls.length === 0) {
      return { success: false, error: 'VALIDATION_FAILED: Instagram requires at least one image or video.' };
    }
    
    // Instagram Graph API requires two steps (container creation + publishing)
    // This represents the initial container creation
    return this.apiRequest(
      `https://graph.facebook.com/v18.0/${account.id}/media`,
      'POST',
      { 
        image_url: mediaUrls[0],
        caption: content
      },
      account
    );
  }

  static async publishToFacebook(content: string, mediaUrls: string[], account: IntegrationAccount): Promise<ExecutionResult> {
    return this.apiRequest(
      `https://graph.facebook.com/v18.0/${account.id}/feed`,
      'POST',
      { 
        message: content,
        link: mediaUrls[0] || undefined
      },
      account
    );
  }

  static async publishToTikTok(content: string, mediaUrls: string[], account: IntegrationAccount): Promise<ExecutionResult> {
    if (!mediaUrls || mediaUrls.length === 0) {
      return { success: false, error: 'VALIDATION_FAILED: TikTok requires a video URL.' };
    }
    
    return this.apiRequest(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      'POST',
      {
        post_info: { title: content, privacy_level: 'PUBLIC_TO_EVERYONE' },
        source_info: { source_type: 'PULL_FROM_URL', video_url: mediaUrls[0] }
      },
      account
    );
  }

  static async publishToYouTube(content: string, mediaUrls: string[], account: IntegrationAccount): Promise<ExecutionResult> {
    if (!mediaUrls || mediaUrls.length === 0) {
      return { success: false, error: 'VALIDATION_FAILED: YouTube requires a video file.' };
    }
    
    return this.apiRequest(
      'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status',
      'POST',
      {
        snippet: { title: 'New Brand Content', description: content },
        status: { privacyStatus: 'public' }
      },
      account
    );
  }

  static async getAnalytics(provider: string, account: IntegrationAccount): Promise<ExecutionResult> {
    // In a real scenario, this endpoint varies wildly by provider
    const endpointMap: Record<string, string> = {
      'x': 'https://api.twitter.com/2/users/:id/tweets',
      'instagram': `https://graph.facebook.com/v18.0/${account.id}/insights`,
      'facebook': `https://graph.facebook.com/v18.0/${account.id}/insights`,
      'linkedin': `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${account.id}`
    };

    const url = endpointMap[provider] || `https://api.${provider}.com/v1/analytics`;
    
    return this.apiRequest(url.replace(':id', account.id), 'GET', null, account);
  }
}
