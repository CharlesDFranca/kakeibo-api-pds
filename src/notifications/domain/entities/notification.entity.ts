export enum ENotificationType {
    GOAL_REACHED = 'GOAL_REACHED',
}

export type NotificationProps = {
    userId: string;
    type: ENotificationType;
    title: string;
    message: string;
    readAt: Date | null;
    createdAt: Date;
};

export class Notification {
    constructor(
        public readonly id: string,
        private readonly props: NotificationProps,
    ) {}

    get userId(): string {
        return this.props.userId;
    }
    get type(): ENotificationType {
        return this.props.type;
    }
    get title(): string {
        return this.props.title;
    }
    get message(): string {
        return this.props.message;
    }
    get readAt(): Date | null {
        return this.props.readAt;
    }
    get createdAt(): Date {
        return this.props.createdAt;
    }

    isRead(): boolean {
        return this.props.readAt !== null;
    }

    markAsRead(now: Date = new Date()): void {
        if (this.isRead()) return;
        this.props.readAt = now;
    }
}
