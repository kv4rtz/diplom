import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { Server } from 'socket.io';
import { ChatMember } from 'src/chats/models/chats-members.model';

@Injectable()
export class EventsService {
  constructor() {}

  private server: Server;
  private socketUsers: Map<number, string> = new Map();
  private eventSubject = new Subject<{ event: string; data: any }>();
  private chatSubject = new Subject<{
    chatId: number;
    data: any;
    members?: ChatMember[];
  }>();
  private messageSubject = new Subject<{ chatId: number; data: any }>();

  setServer(server: Server) {
    this.server = server;

    this.eventSubject.subscribe(({ event, data }) => {
      if (this.server) {
        this.server.emit(event, data);
      }
    });

    this.chatSubject.subscribe(({ chatId, data, members }) => {
      if (this.server) {
        if (members) {
          const room = this.server.sockets.adapter.rooms.get(`chat_${chatId}`);

          if (room) {
            for (const [userId, socketId] of this.socketUsers.entries()) {
              if (room.has(socketId)) {
                const notify = members.find(
                  (member) => member.userId === userId,
                )?.notify;

                if (data.dataValues) {
                  data.dataValues.notify = notify;
                } else {
                  data.notify = notify;
                }

                this.server.to(socketId).emit('new_message', data);
              }
            }
          }
        } else {
          this.server.to(`chat_${chatId}`).emit('new_message', data);
        }
      }
    });

    this.messageSubject.subscribe(({ chatId, data }) => {
      if (this.server) {
        this.server.to(`chat_${chatId}`).emit('message_updated', data);
      }
    });
  }

  emit(event: string, data: any) {
    this.eventSubject.next({ event, data });
  }

  emitChat(chatId: number, data: any, members?: ChatMember[]) {
    this.chatSubject.next({ chatId, data, members });
  }

  emitMessage(chatId: number, data: any) {
    this.messageSubject.next({ chatId, data });
  }

  addUserSocket(userId: number, socketId: string) {
    this.socketUsers.set(userId, socketId);
  }

  removeUserSocket(userId: number) {
    this.socketUsers.delete(userId);
  }

  getUserSocket(userId: number): string | undefined {
    return this.socketUsers.get(userId);
  }

  callMember(chatId: number, userId: number, memberId: number) {
    this.emitChat(chatId, { type: 'call_member', chatId, userId, memberId });
  }

  connectUserToChat(userId: number, chatId: number) {
    const socketId = this.getUserSocket(userId);
    if (socketId && this.server) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) socket.join(`chat_${chatId}`);
    }
  }

  disconnectUserFromChat(userId: number, chatId: number) {
    const socketId = this.getUserSocket(userId);
    if (socketId && this.server) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) socket.leave(`chat_${chatId}`);
    }
  }
}
