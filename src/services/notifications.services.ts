// services/notification.service.ts

export const notificationService = {
    async sendOrderConfirmationNotification(order: any) {
      try {
        console.log(`[Notification] Order confirmed: ${order.id}`);
        console.log(`Sending email/SMS to: ${order.user?.email}`);
      } catch (error) {
        console.error("[Notification Error]", error);
      }
    },
  
    async sendRefundNotification(order: any, amount: number) {
      try {
        console.log(
          `[Notification] Refund processed for order: ${order.id}, amount: ${amount}`
        );
        console.log(`Notifying user: ${order.user?.email}`);
      } catch (error) {
        console.error("[Refund Notification Error]", error);
      }
    },
  };