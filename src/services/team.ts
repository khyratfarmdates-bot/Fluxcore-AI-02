import { BaseService } from './base';
import { where, getDocs, query, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TeamMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Pending';
}

class TeamService extends BaseService<TeamMember> {
  constructor() {
    super('team_members');
  }

  async getMembers(workspaceId: string) {
    const q = query(
      collection(db, 'team_members'),
      where('workspaceId', '==', workspaceId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async addMember(workspaceId: string, email: string, role: TeamMember['role']) {
    // In production, would send an invite email
    // For now, create directly for demo or implementation
    return this.create({
      workspaceId,
      role,
      status: 'Pending'
    } as any);
  }
}

export const teamService = new TeamService();
