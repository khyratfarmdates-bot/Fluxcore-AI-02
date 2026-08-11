import { BaseService } from './base';
import { IntegrationAccount } from '../integrations/types';
import { auth } from '../lib/firebase';
import { Timestamp } from 'firebase/firestore';

export interface OAuthState {
  id: string;
  brandId: string;
  provider: string;
  status: 'pending' | 'completed' | 'expired';
  createdAt: Timestamp;
}

class OAuthService extends BaseService<OAuthState> {
  private accountsDb = new BaseService<IntegrationAccount>('integrations');

  constructor() {
    super('oauth_states');
  }

  /**
   * Generates a secure OAuth URL for a provider and stores state in Firestore.
   */
  async startOAuthFlow(brandId: string, provider: string) {
    // We use the firestore document ID as our stateId for security and direct lookup
    const docId = await this.create({
      brandId,
      provider,
      status: 'pending',
      createdAt: Timestamp.now()
    } as OAuthState);

    if (!docId) throw new Error("Failed to initialize OAuth state");
    
    // For Google/YouTube
    if (provider === 'youtube') {
      const clientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
      const origin = window.location.origin.replace('https://localhost', 'http://localhost');
      const redirectUri = `${origin}/api/auth/google/callback`;
      const scopes = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ].join(' ');

      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${docId}`;
    }

    // Fallback for other providers (simulated for now)
    return `https://fluxcore.ai/api/oauth/${provider}/login?state=${docId}`;
  }

  /**
   * Completed the OAuth flow by exchanging code for tokens and saving the account.
   */
  async handleCallback(stateId: string, code: string) {
    const states = await this.getByField('id', stateId);
    const state = states[0];
    
    if (!state || state.status !== 'pending') {
      throw new Error('Invalid or expired OAuth state');
    }

    // Update state
    await this.update(stateId, { status: 'completed' });

    // Simulate token exchange
    const newAccount: Partial<IntegrationAccount> = {
      brandId: state.brandId,
      provider: state.provider as any,
      type: 'social',
      status: 'connected',
      credentials: {
        accessToken: `at_${Math.random().toString(36).substring(7)}`,
        refreshToken: `rt_${Math.random().toString(36).substring(7)}`,
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 3600 * 1000))
      },
      metadata: {
        lastRefresh: Date.now()
      }
    };

    return await this.accountsDb.create(newAccount as IntegrationAccount);
  }

  async refreshToken(accountId: string) {
    const account = await this.accountsDb.getById(accountId);
    if (!account || !account.credentials.refreshToken) return null;

    // Simulate refresh
    const updatedCredentials = {
      ...account.credentials,
      accessToken: `refreshed_at_${Date.now()}`,
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 3600 * 1000))
    };

    await this.accountsDb.update(accountId, { credentials: updatedCredentials });
    return updatedCredentials;
  }
}

export const oauthService = new OAuthService();
