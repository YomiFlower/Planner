export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export interface GoogleCalendarChannel {
  id: string;
  resourceId: string;
  expiration: number;
}

export class GoogleCalendarService {
  private accessToken: string | null = null;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  async setupWebhook(calendarId: string = 'primary', webhookUrl: string): Promise<GoogleCalendarChannel | null> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const channelId = `studyplan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
      token: `studyplan-${calendarId}`,
      params: {
        ttl: '604800' // 7 days in seconds
      }
    };

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/watch`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(channel),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to setup webhook:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting up Google Calendar webhook:', error);
      return null;
    }
  }

  async createEvent(event: Partial<GoogleCalendarEvent>, calendarId: string = 'primary'): Promise<GoogleCalendarEvent | null> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to create event:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      return null;
    }
  }

  async updateEvent(
    eventId: string, 
    event: Partial<GoogleCalendarEvent>, 
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarEvent | null> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to update event:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      return null;
    }
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      return false;
    }
  }

  async getEvents(
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string
  ): Promise<GoogleCalendarEvent[]> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to fetch events:', error);
        return [];
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return [];
    }
  }

  // OAuth helper methods
  static getAuthUrl(clientId: string, redirectUri: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  static async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{ access_token: string; refresh_token: string } | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to exchange code for tokens:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return null;
    }
  }
}

export default GoogleCalendarService;
