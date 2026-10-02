import { getSupabase } from './client';
import { UserSettings, Conversation, Message, UserProfile, UsageRecord } from '../../types';

export interface CloudProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  avatar_type: 'preset' | 'custom' | 'google';
  preset_id: string | null;
  email: string | null;
  updated_at?: string;
}

export const SupabaseDb = {
  // 1. PROFILES
  async getProfile(userId: string): Promise<CloudProfile | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Supabase getProfile error:', error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('Supabase getProfile exception:', e);
      return null;
    }
  },

  async upsertProfile(userId: string, profile: Partial<CloudProfile>): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload: any = {
        id: userId,
        updated_at: new Date().toISOString(),
        ...profile,
      };

      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase upsertProfile error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase upsertProfile exception:', e);
      return false;
    }
  },

  // 2. USER SETTINGS
  async getSettings(userId: string): Promise<Partial<UserSettings> | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        theme: data.theme || undefined,
        colorPreset: data.color_preset || undefined,
        font: data.font || undefined,
        fontSize: data.font_size || undefined,
        chatWidth: data.chat_width || undefined,
        defaultModel: data.default_model || undefined,
        defaultEffort: data.default_effort || undefined,
        defaultMode: data.default_mode || undefined,
        voiceInput: data.voice_input ?? undefined,
        readResponsesAloud: data.read_responses_aloud ?? undefined,
        tone: data.tone || undefined,
        desktopWallpaper: data.desktop_wallpaper || undefined,
        mobileWallpaper: data.mobile_wallpaper || undefined,
      };
    } catch (e) {
      console.warn('Supabase getSettings exception:', e);
      return null;
    }
  },

  async upsertSettings(userId: string, settings: Partial<UserSettings>): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload: any = {
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (settings.theme !== undefined) payload.theme = settings.theme;
      if (settings.colorPreset !== undefined) payload.color_preset = settings.colorPreset;
      if (settings.font !== undefined) payload.font = settings.font;
      if (settings.fontSize !== undefined) payload.font_size = settings.fontSize;
      if (settings.chatWidth !== undefined) payload.chat_width = settings.chatWidth;
      if (settings.defaultModel !== undefined) payload.default_model = settings.defaultModel;
      if (settings.defaultEffort !== undefined) payload.default_effort = settings.defaultEffort;
      if (settings.defaultMode !== undefined) payload.default_mode = settings.defaultMode;
      if (settings.voiceInput !== undefined) payload.voice_input = settings.voiceInput;
      if (settings.readResponsesAloud !== undefined) payload.read_responses_aloud = settings.readResponsesAloud;
      if (settings.tone !== undefined) payload.tone = settings.tone;
      if (settings.desktopWallpaper !== undefined) payload.desktop_wallpaper = settings.desktopWallpaper;
      if (settings.mobileWallpaper !== undefined) payload.mobile_wallpaper = settings.mobileWallpaper;

      const { error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
      if (error) {
        console.warn('Supabase upsertSettings error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase upsertSettings exception:', e);
      return false;
    }
  },

  // 3. CONVERSATIONS
  async getConversations(userId: string): Promise<Conversation[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data: convData, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (convErr || !convData) {
        console.warn('Supabase getConversations error:', convErr?.message);
        return null;
      }

      // Fetch messages for these conversations
      const convIds = convData.map((c: any) => c.id);
      let messagesByConv: Record<string, Message[]> = {};

      if (convIds.length > 0) {
        const { data: msgData, error: msgErr } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: true });

        if (!msgErr && msgData) {
          msgData.forEach((m: any) => {
            if (!messagesByConv[m.conversation_id]) {
              messagesByConv[m.conversation_id] = [];
            }
            messagesByConv[m.conversation_id].push({
              id: m.id,
              role: m.role,
              content: m.content || '',
              timestamp: m.created_at || new Date().toISOString(),
              modelUsed: m.model_used || undefined,
              providerUsed: m.provider_used || undefined,
              effortUsed: m.effort_used || undefined,
              error: m.error || false,
              errorMessage: m.error_message || undefined,
              attachments: m.attachments || undefined,
              researchData: m.research_data || undefined,
              generatedProject: m.generated_project || undefined,
            });
          });
        }
      }

      return convData.map((c: any) => ({
        id: c.id,
        title: c.title || 'Untitled conversation',
        messages: messagesByConv[c.id] || [],
        modelId: c.model_id || 'gemini-3.8-flash',
        effort: c.effort || 'medium',
        createdAt: c.created_at || new Date().toISOString(),
        updatedAt: c.updated_at || new Date().toISOString(),
        pinned: Boolean(c.pinned),
        archived: Boolean(c.archived),
        mode: c.mode || 'chat',
        generatedProject: c.generated_project || undefined,
      }));
    } catch (e) {
      console.warn('Supabase getConversations exception:', e);
      return null;
    }
  },

  async upsertConversation(userId: string, conv: Conversation): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload: any = {
        id: conv.id,
        user_id: userId,
        title: conv.title,
        model_id: conv.modelId,
        effort: conv.effort,
        mode: conv.mode,
        pinned: conv.pinned || false,
        archived: conv.archived || false,
        generated_project: conv.generatedProject || null,
        updated_at: conv.updatedAt || new Date().toISOString(),
        created_at: conv.createdAt || new Date().toISOString(),
      };

      const { error } = await supabase.from('conversations').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase upsertConversation error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase upsertConversation exception:', e);
      return false;
    }
  },

  async deleteConversation(userId: string, convId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', convId)
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase deleteConversation error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase deleteConversation exception:', e);
      return false;
    }
  },

  // 4. MESSAGES
  async persistMessage(userId: string, conversationId: string, message: Message): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload: any = {
        id: message.id,
        conversation_id: conversationId,
        user_id: userId,
        role: message.role,
        content: message.content,
        model_used: message.modelUsed || null,
        provider_used: message.providerUsed || null,
        effort_used: message.effortUsed || null,
        error: message.error || false,
        error_message: message.errorMessage || null,
        attachments: message.attachments || null,
        research_data: message.researchData || null,
        generated_project: message.generatedProject || null,
        created_at: message.timestamp || new Date().toISOString(),
      };

      const { error } = await supabase.from('messages').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase persistMessage error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase persistMessage exception:', e);
      return false;
    }
  },

  // 5. USAGE RECORDS
  async getUsageRecords(userId: string): Promise<UsageRecord[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('usage_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(300);

      if (error || !data) return null;

      return data.map((r: any) => ({
        id: r.id,
        timestamp: new Date(r.created_at).getTime(),
        provider: r.provider,
        model: r.model_id,
        requestType: r.request_type || 'chat',
        inputTokens: r.input_tokens || 0,
        outputTokens: r.output_tokens || 0,
        totalTokens: r.total_tokens || 0,
        durationMs: r.duration_ms || 0,
        status: r.status || 'success',
        errorMessage: r.error_message || undefined,
      }));
    } catch (e) {
      console.warn('Supabase getUsageRecords exception:', e);
      return null;
    }
  },

  async persistUsageRecord(userId: string, record: UsageRecord): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload: any = {
        id: record.id,
        user_id: userId,
        provider: record.provider,
        model_id: record.model,
        request_type: record.requestType,
        input_tokens: record.inputTokens || 0,
        output_tokens: record.outputTokens || 0,
        total_tokens: record.totalTokens || 0,
        duration_ms: record.durationMs || 0,
        status: record.status,
        error_message: record.errorMessage || null,
        created_at: new Date(record.timestamp).toISOString(),
      };

      const { error } = await supabase.from('usage_records').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase persistUsageRecord error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase persistUsageRecord exception:', e);
      return false;
    }
  },

  // 6. AVATAR STORAGE
  async uploadAvatar(userId: string, file: Blob, fileExt: string = 'webp'): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const path = `${userId}/avatar-${Date.now()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          upsert: true,
          contentType: file.type || 'image/webp',
        });

      if (uploadErr) {
        console.warn('Supabase uploadAvatar error:', uploadErr.message);
        return null;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return data?.publicUrl || null;
    } catch (e) {
      console.warn('Supabase uploadAvatar exception:', e);
      return null;
    }
  },
};
