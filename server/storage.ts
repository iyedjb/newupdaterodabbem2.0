import { 
  type User,
  type InsertUser,
  type UpdateUser,
  type Client, 
  type InsertClient,
  type UpdateClient,
  type Child,
  type InsertChild,
  type MonthlyReport,
  type Destination,
  type InsertDestination,
  type FinancialTransaction,
  type InsertFinancialTransaction,
  type Prospect,
  type InsertProspect,
  type UpdateProspect,
  type Activity,
  type InsertActivity,
  type Bus,
  type InsertBus,
  type SeatReservation,
  type InsertSeatReservation,
  type Receipt,
  type InsertReceipt,
  type Parcela,
  type InsertParcela,
  type Department,
  type InsertDepartment,
  type TimeRecord,
  type InsertTimeRecord,
  type FacialVerificationSession,
  type InsertFacialVerificationSession,
  type DiscountApprovalRequest,
  type InsertDiscountApprovalRequest,
  type InvitationLink,
  type InsertInvitationLink,
  type CrmTask,
  type InsertCrmTask,
  type Funcionario,
  type InsertFuncionario,
  type Notification,
  type InsertNotification,
  type CancelledClientCredit,
  type InsertCancelledClientCredit
} from "@shared/schema";
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, get, remove, query, orderByChild, equalTo } from 'firebase/database';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser & { id?: string }): Promise<User>;
  updateUser(id: string, user: UpdateUser): Promise<User>;
  deleteUser(id: string): Promise<void>;
  upsertUser(uid: string, email: string): Promise<User>;

  // Client operations
  getClient(id: string): Promise<Client | undefined>;
  getClientByCpf(cpf: string, destination?: string): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  getClientsByDestination(destinationName: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: UpdateClient): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  searchClients(searchTerm: string, includeDeleted?: boolean): Promise<Client[]>;
  // Client approval operations
  getClientByApprovalToken(token: string): Promise<Client | undefined>;
  approveClient(token: string): Promise<Client | undefined>;
  regenerateApprovalLink(clientId: string): Promise<Client>;
  // Referral operations
  getReferralStatistics(): Promise<Array<{
    referrer_id: string;
    referrer_name: string;
    referral_count: number;
    total_revenue: number;
  }>>;

  // Destination operations
  getDestination(id: string): Promise<Destination | undefined>;
  getDestinations(): Promise<Destination[]>;
  getActiveDestinations(): Promise<Destination[]>;
  createDestination(destination: InsertDestination): Promise<Destination>;
  updateDestination(id: string, destination: Partial<InsertDestination>): Promise<Destination>;
  deleteDestination(id: string): Promise<void>;

  // Child operations
  getChild(id: string): Promise<Child | undefined>;
  getChildrenByClientId(clientId: string): Promise<Child[]>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: string, child: Partial<InsertChild>): Promise<Child>;
  deleteChild(id: string): Promise<void>;

  // Monthly report operations
  getMonthlyReport(id: string): Promise<MonthlyReport | undefined>;
  getMonthlyReports(): Promise<MonthlyReport[]>;
  createMonthlyReport(report: MonthlyReport): Promise<MonthlyReport>;

  // Financial transaction operations
  getFinancialTransaction(id: string): Promise<FinancialTransaction | undefined>;
  getFinancialTransactions(): Promise<FinancialTransaction[]>;
  createFinancialTransaction(transaction: InsertFinancialTransaction & { created_by_email: string; created_by_name: string }): Promise<FinancialTransaction>;
  updateFinancialTransaction(id: string, transaction: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction>;
  deleteFinancialTransaction(id: string): Promise<void>;

  // Bill operations (Contas a Pagar e a Receber)
  getBill(id: string): Promise<Bill | undefined>;
  getBills(type?: "pagar" | "receber"): Promise<Bill[]>;
  getBillsByStatus(status: "pending" | "paid" | "overdue"): Promise<Bill[]>;
  createBill(bill: InsertBill & { created_by_email: string; created_by_name: string }): Promise<Bill>;
  updateBill(id: string, bill: Partial<InsertBill> & { status?: "pending" | "paid" | "overdue"; paid_at?: Date | null }): Promise<Bill>;
  deleteBill(id: string): Promise<void>;

  // Prospect operations  
  getProspect(id: string): Promise<Prospect | undefined>;
  getProspects(): Promise<Prospect[]>;
  createProspect(prospect: InsertProspect): Promise<Prospect>;
  updateProspect(id: string, prospect: UpdateProspect): Promise<Prospect>;
  deleteProspect(id: string): Promise<void>;
  searchProspects(searchTerm: string): Promise<Prospect[]>;
  // Prospect quote operations
  getProspectByQuoteToken(token: string): Promise<Prospect | undefined>;
  updateQuoteStatus(token: string, status: 'viewed' | 'accepted' | 'rejected'): Promise<Prospect | undefined>;
  convertProspectToClient(prospectId: string): Promise<{ prospect: Prospect; client: Client }>;

  // Activity tracking operations
  getActivities(filters?: { userEmail?: string; fromMs?: number; toMs?: number; limit?: number; clientName?: string }): Promise<any[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  getTopCreators(filters?: { fromMs?: number; toMs?: number; limit?: number }): Promise<{ user_email: string; count: number; user_id: string }[]>;

  // Bus operations
  getBus(id: string): Promise<Bus | undefined>;
  getBuses(): Promise<Bus[]>;
  getActiveBuses(): Promise<Bus[]>;
  createBus(bus: InsertBus): Promise<Bus>;
  updateBus(id: string, bus: Partial<InsertBus>): Promise<Bus>;
  deleteBus(id: string): Promise<void>;

  // Seat reservation operations
  getSeatReservation(id: string): Promise<SeatReservation | undefined>;
  getSeatReservations(): Promise<SeatReservation[]>;
  getSeatReservationsByDestination(destinationId: string): Promise<SeatReservation[]>;
  getSeatReservationsByBus(busId: string): Promise<SeatReservation[]>;
  getSeatReservationsWithClientsByDestination(destinationId: string): Promise<Array<SeatReservation & { client?: Client; is_child?: boolean; child_data?: Child; parent_client_id?: string }>>;
  getAllPassengersByDestination(destinationName: string): Promise<Array<{ client_id: string; client_name: string; seat_number: string | null; client?: Client; is_child: boolean; child_id?: string; child_data?: Child; is_deleted?: boolean }>>;
  createSeatReservation(reservation: InsertSeatReservation): Promise<SeatReservation>;
  updateSeatReservation(id: string, reservation: Partial<InsertSeatReservation>): Promise<SeatReservation>;
  deleteSeatReservation(id: string): Promise<void>;
  getSeatReservationByDestinationAndSeat(destinationId: string, seatNumber: string): Promise<SeatReservation | undefined>;

  // Receipt operations
  getReceipt(id: string): Promise<Receipt | undefined>;
  getReceipts(): Promise<Receipt[]>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  updateReceipt(id: string, receipt: Partial<InsertReceipt>): Promise<Receipt>;
  deleteReceipt(id: string): Promise<void>;

  // Parcela operations
  getParcela(id: string): Promise<Parcela | undefined>;
  getParcelas(): Promise<Parcela[]>;
  getParcelasByClientId(clientId: string): Promise<Parcela[]>;
  getParcelasByMonth(month: number, year: number): Promise<Parcela[]>;
  createParcela(parcela: InsertParcela): Promise<Parcela>;
  updateParcela(id: string, parcela: Partial<InsertParcela>): Promise<Parcela>;
  deleteParcela(id: string): Promise<void>;
  deleteParcelasByClientId(clientId: string): Promise<void>;

  // Department operations
  getDepartment(id: string): Promise<Department | undefined>;
  getDepartments(): Promise<Department[]>;
  getActiveDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department>;
  deleteDepartment(id: string): Promise<void>;

  // Time record operations
  getTimeRecord(id: string): Promise<TimeRecord | undefined>;
  getTimeRecords(): Promise<TimeRecord[]>;
  getTimeRecordsByUserId(userId: string): Promise<TimeRecord[]>;
  getTimeRecordsByDateRange(startDate: string, endDate: string): Promise<TimeRecord[]>;
  getTodayTimeRecord(userId: string): Promise<TimeRecord | undefined>;
  createTimeRecord(timeRecord: InsertTimeRecord): Promise<TimeRecord>;
  updateTimeRecord(id: string, timeRecord: Partial<InsertTimeRecord>): Promise<TimeRecord>;
  deleteTimeRecord(id: string): Promise<void>;

  // Facial verification session operations
  getFacialVerificationSession(id: string): Promise<FacialVerificationSession | undefined>;
  getFacialVerificationSessionByToken(token: string): Promise<FacialVerificationSession | undefined>;
  createFacialVerificationSession(session: InsertFacialVerificationSession): Promise<FacialVerificationSession>;
  updateFacialVerificationSession(id: string, session: Partial<InsertFacialVerificationSession>): Promise<FacialVerificationSession>;
  deleteFacialVerificationSession(id: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;

  // Discount approval request operations
  getDiscountApprovalRequest(id: string): Promise<DiscountApprovalRequest | undefined>;
  getDiscountApprovalRequests(): Promise<DiscountApprovalRequest[]>;
  getPendingDiscountApprovalRequests(): Promise<DiscountApprovalRequest[]>;
  createDiscountApprovalRequest(request: InsertDiscountApprovalRequest): Promise<DiscountApprovalRequest>;
  approveDiscountRequest(id: string, vadminId: string, vadminName: string, maxDiscountPercentage: number): Promise<DiscountApprovalRequest>;
  rejectDiscountRequest(id: string, vadminId: string, vadminName: string, reason?: string): Promise<DiscountApprovalRequest>;
  deleteDiscountApprovalRequest(id: string): Promise<void>;

  // Invitation link operations
  getInvitationLink(linkToken: string): Promise<InvitationLink | undefined>;
  createInvitationLink(link: InsertInvitationLink): Promise<InvitationLink>;
  updateInvitationLinkUsage(linkToken: string): Promise<InvitationLink | undefined>;

  // CRM Task operations
  getCrmTask(id: string): Promise<CrmTask | undefined>;
  getCrmTasks(): Promise<CrmTask[]>;
  getCrmTasksByUserId(userId: string): Promise<CrmTask[]>;
  getCrmTasksCreatedBy(userId: string): Promise<CrmTask[]>;
  createCrmTask(task: InsertCrmTask): Promise<CrmTask>;
  updateCrmTask(id: string, task: Partial<InsertCrmTask> & { status?: 'pending' | 'in_progress' | 'completed'; completed_at?: Date | null; completion_percentage?: number }): Promise<CrmTask>;
  deleteCrmTask(id: string): Promise<void>;

  // Notification operations
  getNotifications(userEmail: string, unreadOnly?: boolean): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<Notification>;
  checkAndCreateBillReminders(): Promise<void>; // Check for bills due in 5 days

  // Funcionário operations
  getFuncionario(id: string): Promise<Funcionario | undefined>;
  getFuncionarios(): Promise<Funcionario[]>;
  getActiveFuncionarios(): Promise<Funcionario[]>;
  getTrialFuncionarios(): Promise<Funcionario[]>; // Get funcionários on trial period
  createFuncionario(funcionario: InsertFuncionario): Promise<Funcionario>;
  createTrialFuncionario(funcionario: InsertFuncionario & { trial_period_days: number }): Promise<Funcionario>; // Create funcionário on trial
  updateFuncionario(id: string, funcionario: Partial<InsertFuncionario>): Promise<Funcionario>;
  activateTrialFuncionario(id: string): Promise<Funcionario>; // Activate trial funcionário
  terminateFuncionario(id: string, terminationReason: string): Promise<Funcionario>;
  deleteFuncionario(id: string): Promise<void>;

  // Proposal operations (RH database only)
  getProposal(id: string): Promise<Proposal | undefined>;
  getProposals(): Promise<Proposal[]>;
  createProposal(proposal: Proposal): Promise<Proposal>;
  deleteProposal(id: string): Promise<void>;

  // Cancelled Client Credit operations
  getCancelledClientCredit(id: string): Promise<CancelledClientCredit | undefined>;
  getCancelledClientCredits(): Promise<CancelledClientCredit[]>;
  getCancelledClientCreditsByClientId(clientId: string): Promise<CancelledClientCredit[]>;
  getActiveCancelledClientCredits(): Promise<CancelledClientCredit[]>; // Not expired and not used
  getExpiredCancelledClientCredits(): Promise<CancelledClientCredit[]>;
  createCancelledClientCredit(credit: InsertCancelledClientCredit): Promise<CancelledClientCredit>;
  updateCancelledClientCredit(id: string, credit: Partial<CancelledClientCredit>): Promise<CancelledClientCredit>;
  markCreditAsUsed(id: string, usedForClientId: string): Promise<CancelledClientCredit>;
  updateExpiredCredits(): Promise<number>; // Returns count of credits marked as expired
  
  // Client cancellation operation
  cancelClient(clientId: string, reason: string, cancelledByEmail: string, cancelledByName: string): Promise<{
    client: Client;
    credit: CancelledClientCredit;
    cancelledReceipts: Receipt[];
    removedSeatReservations: SeatReservation[];
  }>;
}

// Firebase Realtime Database storage implementation
class RTDBStorage implements IStorage {
  private db: any; // Main database (roda-bem-turismo)
  private dbRh: any; // RH database (cidade-dofuturo)
  
  constructor() {
    try {
      // Main app database (roda-bem-turismo)
      const mainConfig = {
        apiKey: "AIzaSyDdNLa9sgFztIE90i9B7F8aHKtksJLaA-I",
        authDomain: "roda-bem-turismo.firebaseapp.com",
        databaseURL: "https://roda-bem-turismo-default-rtdb.firebaseio.com",
        projectId: "roda-bem-turismo",
        storageBucket: "roda-bem-turismo.firebasestorage.app",
        messagingSenderId: "732861766010",
        appId: "1:732861766010:web:a268ba64b148ac09a99ec3",
        measurementId: "G-0Y9ZPTWPWZ"
      };
      
      const mainApp = initializeApp(mainConfig);
      this.db = getDatabase(mainApp);
      
      // RH database (cidade-dofuturo)
      const rhConfig = {
        apiKey: "AIzaSyB47aV1YCX-WgBK3awroJ6ucC79XDFsQdc",
        authDomain: "cidade-dofuturo.firebaseapp.com",
        databaseURL: "https://cidade-dofuturo-default-rtdb.firebaseio.com",
        projectId: "cidade-dofuturo",
        storageBucket: "cidade-dofuturo.firebasestorage.app",
        messagingSenderId: "486900760147",
        appId: "1:486900760147:web:2c70ee9009e28675a350a6",
        measurementId: "G-9C544QZGNJ"
      };
      
      const rhApp = initializeApp(rhConfig, 'rh-app');
      this.dbRh = getDatabase(rhApp);
      
      console.log('Firebase RTDB initialized successfully (main + RH)');
    } catch (error) {
      console.error('Failed to initialize Firebase RTDB:', error);
      throw error;
    }
  }

  private convertDatesToTimestamp(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(item => this.convertDatesToTimestamp(item));
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        const convertedValue = this.convertDatesToTimestamp(obj[key]);
        // Only include properties that are not undefined to avoid Firebase RTDB errors
        if (convertedValue !== undefined) {
          converted[key] = convertedValue;
        }
      }
      return converted;
    }
    return obj;
  }

  private convertTimestampsToDates(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string' && obj.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return new Date(obj);
    }
    if (Array.isArray(obj)) return obj.map(item => this.convertTimestampsToDates(item));
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        converted[key] = this.convertTimestampsToDates(obj[key]);
      }
      return converted;
    }
    return obj;
  }

  // In-memory fallback for development
  private users: Map<string, User> = new Map();
  private clients: Map<string, Client> = new Map();
  private destinations: Map<string, Destination> = new Map();
  private children: Map<string, Child> = new Map();
  private reports: Map<string, MonthlyReport> = new Map();
  private financialTransactions: Map<string, FinancialTransaction> = new Map();
  private prospects: Map<string, Prospect> = new Map();
  private crmTasks: Map<string, CrmTask> = new Map();
  private nextId = 1;

  private generateId(): string {
    return `rtdb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLocalDateString(date: Date = new Date()): string {
    // Convert to Brazil timezone (America/Sao_Paulo)
    const brazilDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const year = brazilDate.getFullYear();
    const month = String(brazilDate.getMonth() + 1).padStart(2, '0');
    const day = String(brazilDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const userRef = ref(this.db, `users/${id}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return this.users.get(id);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const usersRef = ref(this.db, 'users');
      const emailQuery = query(usersRef, orderByChild('email'), equalTo(email));
      const snapshot = await get(emailQuery);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userId = Object.keys(data)[0]; // Get first (and should be only) match
        if (userId) {
          return this.convertTimestampsToDates({ id: userId, ...data[userId] });
        }
      }
      
      // Fallback to in-memory search by email
      const users = Array.from(this.users.values());
      return users.find(user => user.email === email);
    } catch (error) {
      console.error('Error getting user by email:', error);
      const users = Array.from(this.users.values());
      return users.find(user => user.email === email);
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const usersRef = ref(this.db, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => 
          this.convertTimestampsToDates({ id, ...data[id] })
        );
      }
      return [];
    } catch (error) {
      console.error('Error getting users:', error);
      return Array.from(this.users.values());
    }
  }

  async createUser(insertUser: InsertUser & { id?: string }): Promise<User> {
    try {
      const now = new Date();
      const user: User = {
        id: insertUser.id || this.generateId(), // Use provided ID (Firebase UID) or generate fallback
        ...insertUser,
        created_at: now,
        updated_at: now,
      };

      // Remove id from user data before storing to avoid duplication
      const { id: _, ...userDataWithoutId } = user;
      const userRef = ref(this.db, `users/${user.id}`);
      await set(userRef, this.convertDatesToTimestamp(userDataWithoutId));
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      // Fallback to memory storage
      const now = new Date();
      const user: User = {
        id: insertUser.id || this.generateId(),
        ...insertUser,
        created_at: now,
        updated_at: now,
      };
      this.users.set(user.id, user);
      return user;
    }
  }

  // Helper method to create or update user on first login (upsert)
  async upsertUser(uid: string, email: string): Promise<User> {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const normalizedEmail = email.toLowerCase();
      
      // Determine role based on email
      const vadminEmails = ['alda@rodabemturismo.com', 'daniel@rodabemturismo.com', 'rosinha@rodabemturismo.com', 'iyed@rodabemturismo.com'];
      const role = vadminEmails.includes(normalizedEmail) ? 'vadmin' : 'admin';
      
      // First check if user already exists by UID
      const existingUserByUid = await this.getUser(uid);
      if (existingUserByUid) {
        // If user is a vadmin email but doesn't have vadmin role, update it
        if (vadminEmails.includes(normalizedEmail) && existingUserByUid.role !== 'vadmin') {
          console.log(`Upgrading user ${normalizedEmail} from ${existingUserByUid.role} to vadmin`);
          return await this.updateUser(uid, { role: 'vadmin' });
        }
        return existingUserByUid;
      }

      // Check if user already exists by email (might have different ID)
      const existingUserByEmail = await this.getUserByEmail(normalizedEmail);
      if (existingUserByEmail) {
        // If existing user has a different ID than the Firebase UID,
        // we need to handle this case. For now, just return the existing user.
        // TODO: Implement proper user migration if needed
        return existingUserByEmail;
      }

      // Create new user record
      return await this.createUser({
        id: uid,
        email: normalizedEmail,
        role
      });
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updateUser: UpdateUser): Promise<User> {
    try {
      const existingUser = await this.getUser(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      const now = new Date();
      const updatedUser: User = {
        ...existingUser,
        ...updateUser,
        updated_at: now,
      };

      // Remove id from user data before storing to avoid duplication
      const { id: _, ...userDataWithoutId } = updatedUser;
      const userRef = ref(this.db, `users/${id}`);
      await set(userRef, this.convertDatesToTimestamp(userDataWithoutId));
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      // Fallback to memory storage
      const existingUser = this.users.get(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      const now = new Date();
      const updatedUser: User = {
        ...existingUser,
        ...updateUser,
        updated_at: now,
      };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const userRef = ref(this.db, `users/${id}`);
      await remove(userRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      // Fallback to memory storage
      this.users.delete(id);
    }
  }

  // Client operations
  async getClient(id: string): Promise<Client | undefined> {
    try {
      const clientRef = ref(this.db, `clients/${id}`);
      const snapshot = await get(clientRef);
      
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting client:', error);
      return this.clients.get(id);
    }
  }

  async getClients(): Promise<Client[]> {
    try {
      const clientsRef = ref(this.db, 'clients');
      const snapshot = await get(clientsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => 
          this.convertTimestampsToDates({ id, ...data[id] })
        );
      }
      return [];
    } catch (error) {
      console.error('Error getting clients:', error);
      return Array.from(this.clients.values());
    }
  }

  async getClientsByDestination(destinationName: string): Promise<Client[]> {
    try {
      const allClients = await this.getClients();
      return allClients.filter(client => 
        client.destination === destinationName && 
        !(client as any).is_deleted && 
        client.approval_status !== "cancelled"
      );
    } catch (error) {
      console.error('Error getting clients by destination:', error);
      return [];
    }
  }

  async getClientByCpf(cpf: string, destination?: string): Promise<Client | undefined> {
    try {
      const normalizedCpf = cpf.replace(/\D/g, '');
      const clients = await this.getClients();
      return clients.find(client => {
        if ((client as any).is_deleted) return false;
        const clientCpf = (client.cpf || '').replace(/\D/g, '');
        const cpfMatch = clientCpf === normalizedCpf;
        if (destination) {
          return cpfMatch && client.destination === destination;
        }
        return cpfMatch;
      });
    } catch (error) {
      console.error('Error getting client by CPF:', error);
      return undefined;
    }
  }

  // Generate a secure approval token
  private generateApprovalToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    try {
      const now = new Date();
      const approvalExpiresAt = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // 72 hours from now
      
      const client: Client = {
        id: this.generateId(),
        ...insertClient,
        full_name_search: `${insertClient.first_name} ${insertClient.last_name}`.toLowerCase(),
        approval_token: this.generateApprovalToken(),
        approval_status: "pending",
        approval_expires_at: approvalExpiresAt,
        created_at: now,
        updated_at: now,
      };

      const clientRef = ref(this.db, `clients/${client.id}`);
      await set(clientRef, this.convertDatesToTimestamp(client));
      
      return client;
    } catch (error) {
      console.error('Error creating client:', error);
      // Fallback to memory storage
      const now = new Date();
      const approvalExpiresAt = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // 72 hours from now
      
      const client: Client = {
        id: this.generateId(),
        ...insertClient,
        full_name_search: `${insertClient.first_name} ${insertClient.last_name}`.toLowerCase(),
        approval_token: this.generateApprovalToken(),
        approval_status: "pending",
        approval_expires_at: approvalExpiresAt,
        created_at: now,
        updated_at: now,
      };
      this.clients.set(client.id, client);
      return client;
    }
  }

  async updateClient(id: string, clientUpdate: UpdateClient): Promise<Client> {
    try {
      const current = await this.getClient(id);
      if (!current) throw new Error('Client not found');
      
      const now = new Date();
      const updated: Client = {
        ...current,
        ...clientUpdate,
        full_name_search: clientUpdate.first_name || clientUpdate.last_name 
          ? `${clientUpdate.first_name || current.first_name} ${clientUpdate.last_name || current.last_name}`.toLowerCase()
          : current.full_name_search,
        updated_at: now,
      };
      
      const clientRef = ref(this.db, `clients/${id}`);
      await set(clientRef, this.convertDatesToTimestamp(updated));
      
      return updated;
    } catch (error) {
      console.error('Error updating client:', error);
      // Fallback to memory storage
      const current = this.clients.get(id);
      if (!current) throw new Error('Client not found');
      
      const now = new Date();
      const updated: Client = {
        ...current,
        ...clientUpdate,
        full_name_search: clientUpdate.first_name || clientUpdate.last_name 
          ? `${clientUpdate.first_name || current.first_name} ${clientUpdate.last_name || current.last_name}`.toLowerCase()
          : current.full_name_search,
        updated_at: now,
      };
      
      this.clients.set(id, updated);
      return updated;
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      const clientRef = ref(this.db, `clients/${id}`);
      await remove(clientRef);
    } catch (error) {
      console.error('Error deleting client:', error);
      this.clients.delete(id);
    }
  }

  async searchClients(searchTerm: string, includeDeleted: boolean = false): Promise<Client[]> {
    try {
      const clients = await this.getClients();
      const term = searchTerm.toLowerCase();
      return clients.filter(client => {
        const matchesTerm = client.full_name_search.includes(term);
        if (includeDeleted) return matchesTerm;
        return matchesTerm && !(client as any).is_deleted;
      });
    } catch (error) {
      console.error('Error searching clients:', error);
      const term = searchTerm.toLowerCase();
      return Array.from(this.clients.values()).filter(client => 
        client.full_name_search.includes(term)
      );
    }
  }

  async getClientByApprovalToken(token: string): Promise<Client | undefined> {
    try {
      // Query Firebase for client with this approval token
      const clientsRef = ref(this.db, 'clients');
      const clientQuery = query(clientsRef, orderByChild('approval_token'), equalTo(token));
      const snapshot = await get(clientQuery);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const clientId = Object.keys(data)[0]; // Get the first (should be only) result
        return this.convertTimestampsToDates({ id: clientId, ...data[clientId] });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting client by approval token:', error);
      
      // Fallback: Get all clients from Firebase and filter in memory
      try {
        const allClients = await this.getClients();
        return allClients.find(client => client.approval_token === token);
      } catch (fallbackError) {
        console.error('Error in fallback client query:', fallbackError);
        // Final fallback to memory storage
        return Array.from(this.clients.values()).find(client => 
          client.approval_token === token
        );
      }
    }
  }

  async approveClient(token: string): Promise<Client | undefined> {
    try {
      const client = await this.getClientByApprovalToken(token);
      if (!client) {
        return undefined;
      }

      // Check if approval has expired
      const now = new Date();
      if (client.approval_expires_at && client.approval_expires_at < now) {
        // Update status to expired
        const expiredClient = await this.updateClient(client.id, {
          approval_status: "expired"
        });
        return expiredClient;
      }

      // Check if already approved
      if (client.approval_status === "approved") {
        return client;
      }

      // Approve the client
      const approvedClient = await this.updateClient(client.id, {
        approval_status: "approved",
        approval_date: now
      });

      return approvedClient;
    } catch (error) {
      console.error('Error approving client:', error);
      return undefined;
    }
  }

  async regenerateApprovalLink(clientId: string): Promise<Client> {
    try {
      const client = await this.getClient(clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      const now = new Date();
      const approvalExpiresAt = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // 72 hours from now
      const newToken = this.generateApprovalToken();

      const updatedClient = await this.updateClient(clientId, {
        approval_token: newToken,
        approval_status: "pending",
        approval_date: undefined,
        approval_expires_at: approvalExpiresAt,
      });

      return updatedClient;
    } catch (error) {
      console.error('Error regenerating approval link:', error);
      throw error;
    }
  }

  async getReferralStatistics(): Promise<Array<{
    referrer_id: string;
    referrer_name: string;
    referral_count: number;
    total_revenue: number;
  }>> {
    try {
      const clients = await this.getClients();
      
      // Group clients by their referrer
      const referralMap = new Map<string, {
        referrer_name: string;
        referral_count: number;
        total_revenue: number;
      }>();

      for (const client of clients) {
        if (client.referred_by) {
          const existing = referralMap.get(client.referred_by);
          const revenue = typeof client.travel_price === 'number' ? client.travel_price : 0;
          
          if (existing) {
            existing.referral_count++;
            existing.total_revenue += revenue;
          } else {
            // Get referrer name
            const referrer = clients.find(c => c.id === client.referred_by);
            if (referrer) {
              referralMap.set(client.referred_by, {
                referrer_name: `${referrer.first_name} ${referrer.last_name}`,
                referral_count: 1,
                total_revenue: revenue,
              });
            }
          }
        }
      }

      // Convert map to array and sort by referral count
      return Array.from(referralMap.entries())
        .map(([referrer_id, stats]) => ({
          referrer_id,
          ...stats,
        }))
        .sort((a, b) => b.referral_count - a.referral_count);
    } catch (error) {
      console.error('Error getting referral statistics:', error);
      return [];
    }
  }

  // Destination operations
  async getDestination(id: string): Promise<Destination | undefined> {
    try {
      const destinationRef = ref(this.db, `destinations/${id}`);
      const snapshot = await get(destinationRef);
      
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting destination:', error);
      return this.destinations.get(id);
    }
  }

  async getDestinations(): Promise<Destination[]> {
    try {
      const destinationsRef = ref(this.db, 'destinations');
      const snapshot = await get(destinationsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data)
          .map(id => this.convertTimestampsToDates({ id, ...data[id] }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      return [];
    } catch (error) {
      console.error('Error getting destinations:', error);
      return Array.from(this.destinations.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  async getActiveDestinations(): Promise<Destination[]> {
    try {
      const destinations = await this.getDestinations();
      const now = new Date();
      return destinations
        .filter(dest => {
          if (!dest.is_active) return false;
          if (dest.periodo_viagem_fim && dest.periodo_viagem_fim < now) return false;
          return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting active destinations:', error);
      const now = new Date();
      return Array.from(this.destinations.values())
        .filter(dest => {
          if (!dest.is_active) return false;
          if (dest.periodo_viagem_fim && dest.periodo_viagem_fim < now) return false;
          return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  async createDestination(insertDestination: InsertDestination): Promise<Destination> {
    try {
      const now = new Date();
      const destination: Destination = {
        id: this.generateId(),
        ...insertDestination,
        created_at: now,
        updated_at: now,
      };

      const destinationRef = ref(this.db, `destinations/${destination.id}`);
      await set(destinationRef, this.convertDatesToTimestamp(destination));
      
      return destination;
    } catch (error) {
      console.error('Error creating destination:', error);
      // Fallback to memory storage
      const now = new Date();
      const destination: Destination = {
        id: this.generateId(),
        ...insertDestination,
        created_at: now,
        updated_at: now,
      };
      this.destinations.set(destination.id, destination);
      return destination;
    }
  }

  async updateDestination(id: string, destinationUpdate: Partial<InsertDestination>): Promise<Destination> {
    try {
      const current = await this.getDestination(id);
      if (!current) throw new Error('Destination not found');
      
      const now = new Date();
      const updated: Destination = {
        ...current,
        ...destinationUpdate,
        updated_at: now,
      };
      
      const destinationRef = ref(this.db, `destinations/${id}`);
      await set(destinationRef, this.convertDatesToTimestamp(updated));
      
      return updated;
    } catch (error) {
      console.error('Error updating destination:', error);
      // Fallback to memory storage
      const current = this.destinations.get(id);
      if (!current) throw new Error('Destination not found');
      
      const now = new Date();
      const updated: Destination = {
        ...current,
        ...destinationUpdate,
        updated_at: now,
      };
      
      this.destinations.set(id, updated);
      return updated;
    }
  }

  async deleteDestination(id: string): Promise<void> {
    try {
      const destinationRef = ref(this.db, `destinations/${id}`);
      await remove(destinationRef);
    } catch (error) {
      console.error('Error deleting destination:', error);
      this.destinations.delete(id);
    }
  }

  // Child operations
  async getChild(id: string): Promise<Child | undefined> {
    try {
      const childRef = ref(this.db, `children/${id}`);
      const snapshot = await get(childRef);
      
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting child:', error);
      return this.children.get(id);
    }
  }

  async getAllChildren(): Promise<Child[]> {
    try {
      const childrenRef = ref(this.db, 'children');
      const snapshot = await get(childrenRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data)
          .map(id => this.convertTimestampsToDates({ id, ...data[id] }));
      }
      return [];
    } catch (error) {
      console.error('Error getting all children:', error);
      return Array.from(this.children.values());
    }
  }

  async getChildrenByClientId(clientId: string): Promise<Child[]> {
    try {
      const client = await this.getClient(clientId);
      if (!client || (client as any).is_deleted || client.approval_status === "cancelled") {
        return [];
      }
      const childrenRef = ref(this.db, 'children');
      const snapshot = await get(childrenRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data)
          .map(id => this.convertTimestampsToDates({ id, ...data[id] }))
          .filter((child: Child) => child.client_id === clientId);
      }
      return [];
    } catch (error) {
      console.error('Error getting children by client ID:', error);
      return Array.from(this.children.values()).filter(child => child.client_id === clientId);
    }
  }

  async createChild(insertChild: InsertChild): Promise<Child> {
    try {
      const child: Child = {
        id: this.generateId(),
        ...insertChild,
      };

      const childRef = ref(this.db, `children/${child.id}`);
      await set(childRef, this.convertDatesToTimestamp(child));
      
      return child;
    } catch (error) {
      console.error('Error creating child:', error);
      // Fallback to memory storage
      const child: Child = {
        id: this.generateId(),
        ...insertChild,
      };
      this.children.set(child.id, child);
      return child;
    }
  }

  async updateChild(id: string, childUpdate: Partial<InsertChild>): Promise<Child> {
    try {
      const current = await this.getChild(id);
      if (!current) throw new Error('Child not found');
      
      const updated: Child = {
        ...current,
        ...childUpdate,
      };
      
      const childRef = ref(this.db, `children/${id}`);
      await set(childRef, this.convertDatesToTimestamp(updated));
      
      return updated;
    } catch (error) {
      console.error('Error updating child:', error);
      // Fallback to memory storage
      const current = this.children.get(id);
      if (!current) throw new Error('Child not found');
      
      const updated: Child = {
        ...current,
        ...childUpdate,
      };
      
      this.children.set(id, updated);
      return updated;
    }
  }

  async deleteChild(id: string): Promise<void> {
    try {
      const childRef = ref(this.db, `children/${id}`);
      await remove(childRef);
    } catch (error) {
      console.error('Error deleting child:', error);
      this.children.delete(id);
    }
  }

  // Monthly report operations
  async getMonthlyReport(id: string): Promise<MonthlyReport | undefined> {
    try {
      const reportRef = ref(this.db, `monthly_reports/${id}`);
      const snapshot = await get(reportRef);
      
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting monthly report:', error);
      return this.reports.get(id);
    }
  }

  async getMonthlyReports(): Promise<MonthlyReport[]> {
    try {
      const reportsRef = ref(this.db, 'monthly_reports');
      const snapshot = await get(reportsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data)
          .map(id => this.convertTimestampsToDates({ id, ...data[id] }))
          .sort((a, b) => {
            // Sort by year and month in descending order (most recent first)
            if (a.year !== b.year) {
              return b.year - a.year;
            }
            return b.month - a.month;
          });
      }
      return [];
    } catch (error) {
      console.error('Error getting monthly reports:', error);
      return Array.from(this.reports.values());
    }
  }

  async createMonthlyReport(report: MonthlyReport): Promise<MonthlyReport> {
    try {
      const newReport = { ...report, id: this.generateId() };

      const reportRef = ref(this.db, `monthly_reports/${newReport.id}`);
      await set(reportRef, this.convertDatesToTimestamp(newReport));
      
      return newReport;
    } catch (error) {
      console.error('Error creating monthly report:', error);
      // Fallback to memory storage
      const newReport = { ...report, id: this.generateId() };
      this.reports.set(newReport.id, newReport);
      return newReport;
    }
  }

  // Financial transaction operations
  async getFinancialTransaction(id: string): Promise<FinancialTransaction | undefined> {
    try {
      const transactionRef = ref(this.db, `financial_transactions/${id}`);
      const snapshot = await get(transactionRef);
      
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting financial transaction:', error);
      return this.financialTransactions.get(id);
    }
  }

  async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    try {
      const transactionsRef = ref(this.db, 'financial_transactions');
      const snapshot = await get(transactionsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data)
          .map(id => this.convertTimestampsToDates({ id, ...data[id] }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return [];
    } catch (error) {
      console.error('Error getting financial transactions:', error);
      return Array.from(this.financialTransactions.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }

  async createFinancialTransaction(insertTransaction: InsertFinancialTransaction & { created_by_email: string; created_by_name: string }): Promise<FinancialTransaction> {
    try {
      const now = new Date();
      const transaction: FinancialTransaction = {
        id: this.generateId(),
        ...insertTransaction,
        created_at: now,
        updated_at: now,
      };

      const transactionRef = ref(this.db, `financial_transactions/${transaction.id}`);
      await set(transactionRef, this.convertDatesToTimestamp(transaction));
      
      return transaction;
    } catch (error) {
      console.error('Error creating financial transaction:', error);
      // Fallback to memory storage
      const now = new Date();
      const transaction: FinancialTransaction = {
        id: this.generateId(),
        ...insertTransaction,
        created_at: now,
        updated_at: now,
      };
      this.financialTransactions.set(transaction.id, transaction);
      return transaction;
    }
  }

  async updateFinancialTransaction(id: string, transactionUpdate: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction> {
    try {
      const current = await this.getFinancialTransaction(id);
      if (!current) throw new Error('Financial transaction not found');
      
      const now = new Date();
      const updated: FinancialTransaction = {
        ...current,
        ...transactionUpdate,
        updated_at: now,
      };
      
      const transactionRef = ref(this.db, `financial_transactions/${id}`);
      await set(transactionRef, this.convertDatesToTimestamp(updated));
      
      return updated;
    } catch (error) {
      console.error('Error updating financial transaction:', error);
      // Fallback to memory storage
      const current = this.financialTransactions.get(id);
      if (!current) throw new Error('Financial transaction not found');
      
      const now = new Date();
      const updated: FinancialTransaction = {
        ...current,
        ...transactionUpdate,
        updated_at: now,
      };
      
      this.financialTransactions.set(id, updated);
      return updated;
    }
  }

  async deleteFinancialTransaction(id: string): Promise<void> {
    try {
      const transactionRef = ref(this.db, `financial_transactions/${id}`);
      await remove(transactionRef);
    } catch (error) {
      console.error('Error deleting financial transaction:', error);
      this.financialTransactions.delete(id);
    }
  }

  // Generate a secure quote token
  private generateQuoteToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Prospect operations
  async getProspect(id: string): Promise<Prospect | undefined> {
    try {
      const prospectRef = ref(this.db, `prospects/${id}`);
      const snapshot = await get(prospectRef);
      
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting prospect:', error);
      return this.prospects.get(id);
    }
  }

  async getProspects(): Promise<Prospect[]> {
    try {
      const prospectsRef = ref(this.db, 'prospects');
      const snapshot = await get(prospectsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => 
          this.convertTimestampsToDates({ id, ...data[id] })
        );
      }
      return [];
    } catch (error) {
      console.error('Error getting prospects:', error);
      return Array.from(this.prospects.values());
    }
  }

  async createProspect(insertProspect: InsertProspect): Promise<Prospect> {
    try {
      const now = new Date();
      const token = this.generateQuoteToken();
      const quoteLinkBase = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.VITE_APP_URL || 'http://localhost:5000';
      
      const prospect: Prospect = {
        id: this.generateId(),
        ...insertProspect,
        full_name_search: `${insertProspect.first_name} ${insertProspect.last_name}`.toLowerCase(),
        quote_token: token,
        quote_link: `${quoteLinkBase}/quote/${token}`,
        quote_status: "pending",
        is_converted: false,
        created_at: now,
        updated_at: now,
      };

      const prospectRef = ref(this.db, `prospects/${prospect.id}`);
      await set(prospectRef, this.convertDatesToTimestamp(prospect));
      
      return prospect;
    } catch (error) {
      console.error('Error creating prospect:', error);
      // Fallback to memory storage
      const now = new Date();
      const token = this.generateQuoteToken();
      const quoteLinkBase = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.VITE_APP_URL || 'http://localhost:5000';
      
      const prospect: Prospect = {
        id: this.generateId(),
        ...insertProspect,
        full_name_search: `${insertProspect.first_name} ${insertProspect.last_name}`.toLowerCase(),
        quote_token: token,
        quote_link: `${quoteLinkBase}/quote/${token}`,
        quote_status: "pending",
        is_converted: false,
        created_at: now,
        updated_at: now,
      };
      this.prospects.set(prospect.id, prospect);
      return prospect;
    }
  }

  async updateProspect(id: string, prospectUpdate: UpdateProspect): Promise<Prospect> {
    try {
      const current = await this.getProspect(id);
      if (!current) throw new Error('Prospect not found');
      
      const now = new Date();
      const updated: Prospect = {
        ...current,
        ...prospectUpdate,
        full_name_search: prospectUpdate.first_name || prospectUpdate.last_name 
          ? `${prospectUpdate.first_name || current.first_name} ${prospectUpdate.last_name || current.last_name}`.toLowerCase()
          : current.full_name_search,
        updated_at: now,
      };
      
      const prospectRef = ref(this.db, `prospects/${id}`);
      await set(prospectRef, this.convertDatesToTimestamp(updated));
      
      return updated;
    } catch (error) {
      console.error('Error updating prospect:', error);
      // Fallback to memory storage
      const current = this.prospects.get(id);
      if (!current) throw new Error('Prospect not found');
      
      const now = new Date();
      const updated: Prospect = {
        ...current,
        ...prospectUpdate,
        full_name_search: prospectUpdate.first_name || prospectUpdate.last_name 
          ? `${prospectUpdate.first_name || current.first_name} ${prospectUpdate.last_name || current.last_name}`.toLowerCase()
          : current.full_name_search,
        updated_at: now,
      };
      
      this.prospects.set(id, updated);
      return updated;
    }
  }

  async deleteProspect(id: string): Promise<void> {
    try {
      const prospectRef = ref(this.db, `prospects/${id}`);
      await remove(prospectRef);
    } catch (error) {
      console.error('Error deleting prospect:', error);
      this.prospects.delete(id);
    }
  }

  async searchProspects(searchTerm: string): Promise<Prospect[]> {
    try {
      const prospects = await this.getProspects();
      const term = searchTerm.toLowerCase();
      return prospects.filter(prospect => 
        prospect.full_name_search.includes(term) ||
        prospect.destination.toLowerCase().includes(term) ||
        (prospect.email && prospect.email.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error('Error searching prospects:', error);
      const term = searchTerm.toLowerCase();
      return Array.from(this.prospects.values()).filter(prospect => 
        prospect.full_name_search.includes(term) ||
        prospect.destination.toLowerCase().includes(term) ||
        (prospect.email && prospect.email.toLowerCase().includes(term))
      );
    }
  }

  async getProspectByQuoteToken(token: string): Promise<Prospect | undefined> {
    try {
      // Query Firebase for prospect with this quote token
      const prospectsRef = ref(this.db, 'prospects');
      const prospectQuery = query(prospectsRef, orderByChild('quote_token'), equalTo(token));
      const snapshot = await get(prospectQuery);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const prospectId = Object.keys(data)[0]; // Get the first (should be only) result
        return this.convertTimestampsToDates({ id: prospectId, ...data[prospectId] });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting prospect by quote token:', error);
      
      // Fallback: Get all prospects from Firebase and filter in memory
      try {
        const allProspects = await this.getProspects();
        return allProspects.find(prospect => prospect.quote_token === token);
      } catch (fallbackError) {
        console.error('Error in fallback prospect query:', fallbackError);
        // Final fallback to memory storage
        return Array.from(this.prospects.values()).find(prospect => 
          prospect.quote_token === token
        );
      }
    }
  }

  async updateQuoteStatus(token: string, status: 'viewed' | 'accepted' | 'rejected'): Promise<Prospect | undefined> {
    try {
      const prospect = await this.getProspectByQuoteToken(token);
      if (!prospect) {
        return undefined;
      }

      // Check if quote has expired
      const now = new Date();
      if (prospect.quote_expires_at && prospect.quote_expires_at < now) {
        // Update status to expired
        const expiredProspect = await this.updateProspect(prospect.id, {
          quote_status: "expired"
        });
        return expiredProspect;
      }

      // Update the quote status
      const updatedProspect = await this.updateProspect(prospect.id, {
        quote_status: status
      });

      return updatedProspect;
    } catch (error) {
      console.error('Error updating quote status:', error);
      return undefined;
    }
  }

  // Activity tracking operations
  async getActivities(filters?: { userEmail?: string; fromMs?: number; toMs?: number; limit?: number; clientName?: string }): Promise<any[]> {
    try {
      const activitiesRef = ref(this.db, 'activities');
      const snapshot = await get(activitiesRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        let activities: Activity[] = Object.keys(data).map(id => 
          this.convertTimestampsToDates({ id, ...data[id] })
        );

        // Apply filters
        if (filters?.userEmail) {
          activities = activities.filter(activity => activity.user_email === filters.userEmail);
        }
        if (filters?.fromMs) {
          activities = activities.filter(activity => activity.created_at_ms >= filters.fromMs!);
        }
        if (filters?.toMs) {
          activities = activities.filter(activity => activity.created_at_ms <= filters.toMs!);
        }
        if (filters?.clientName) {
          const searchTerm = filters.clientName.toLowerCase();
          activities = activities.filter(activity => 
            activity.client_name?.toLowerCase().includes(searchTerm)
          );
        }

        // Sort by creation time (newest first)
        activities.sort((a, b) => b.created_at_ms - a.created_at_ms);

        // Apply limit
        if (filters?.limit) {
          activities = activities.slice(0, filters.limit);
        }

        // Fetch client created_at for activities with client_id
        const clientsRef = ref(this.db, 'clients');
        const clientsSnapshot = await get(clientsRef);
        const clientsData = clientsSnapshot.exists() ? clientsSnapshot.val() : {};
        
        // Enrich activities with client created_at
        const enrichedActivities = activities.map(activity => {
          if (activity.client_id && clientsData[activity.client_id]) {
            const client = this.convertTimestampsToDates(clientsData[activity.client_id]);
            return {
              ...activity,
              client_created_at: client.created_at
            };
          }
          return activity;
        });

        return enrichedActivities;
      }
      return [];
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    try {
      const now = new Date();
      const createdActivity: Activity = {
        id: this.generateId(),
        ...activity,
        created_at: now,
        created_at_ms: now.getTime(),
      };

      const activityRef = ref(this.db, `activities/${createdActivity.id}`);
      await set(activityRef, this.convertDatesToTimestamp(createdActivity));
      
      return createdActivity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  async getTopCreators(filters?: { fromMs?: number; toMs?: number; limit?: number }): Promise<{ user_email: string; count: number; user_id: string }[]> {
    try {
      const activities = await this.getActivities({
        fromMs: filters?.fromMs,
        toMs: filters?.toMs
      });

      // Filter for client creation activities only
      const clientCreations = activities.filter(activity => activity.action === 'client_created');

      // Group by user_email and count
      const userCounts = new Map<string, { count: number; user_id: string }>();
      
      clientCreations.forEach(activity => {
        const current = userCounts.get(activity.user_email) || { count: 0, user_id: activity.user_id };
        userCounts.set(activity.user_email, {
          count: current.count + 1,
          user_id: activity.user_id
        });
      });

      // Convert to array and sort by count (descending)
      let result = Array.from(userCounts.entries()).map(([user_email, data]) => ({
        user_email,
        count: data.count,
        user_id: data.user_id
      }));

      result.sort((a, b) => b.count - a.count);

      // Apply limit
      if (filters?.limit) {
        result = result.slice(0, filters.limit);
      }

      return result;
    } catch (error) {
      console.error('Error getting top creators:', error);
      return [];
    }
  }

  // Bus operations
  async getBus(id: string): Promise<Bus | undefined> {
    try {
      const busRef = ref(this.db, `buses/${id}`);
      const snapshot = await get(busRef);
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting bus:', error);
      return undefined;
    }
  }

  async getBuses(): Promise<Bus[]> {
    try {
      const busesRef = ref(this.db, 'buses');
      const snapshot = await get(busesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => 
          this.convertTimestampsToDates({ id, ...data[id] })
        );
      }
      return [];
    } catch (error) {
      console.error('Error getting buses:', error);
      return [];
    }
  }

  async getActiveBuses(): Promise<Bus[]> {
    try {
      const buses = await this.getBuses();
      return buses.filter(bus => bus.is_active);
    } catch (error) {
      console.error('Error getting active buses:', error);
      return [];
    }
  }

  async createBus(bus: InsertBus): Promise<Bus> {
    try {
      const now = new Date();
      const newBus: Bus = {
        id: this.generateId(),
        ...bus,
        created_at: now,
        updated_at: now,
      };

      const busRef = ref(this.db, `buses/${newBus.id}`);
      await set(busRef, this.convertDatesToTimestamp(newBus));
      
      return newBus;
    } catch (error) {
      console.error('Error creating bus:', error);
      throw error;
    }
  }

  async updateBus(id: string, bus: Partial<InsertBus>): Promise<Bus> {
    try {
      const existingBus = await this.getBus(id);
      if (!existingBus) {
        throw new Error('Bus not found');
      }

      const updatedBus: Bus = {
        ...existingBus,
        ...bus,
        updated_at: new Date(),
      };

      const busRef = ref(this.db, `buses/${id}`);
      await set(busRef, this.convertDatesToTimestamp(updatedBus));
      
      return updatedBus;
    } catch (error) {
      console.error('Error updating bus:', error);
      throw error;
    }
  }

  async deleteBus(id: string): Promise<void> {
    try {
      const busRef = ref(this.db, `buses/${id}`);
      await remove(busRef);
    } catch (error) {
      console.error('Error deleting bus:', error);
      throw error;
    }
  }

  // Seat reservation operations
  async getSeatReservation(id: string): Promise<SeatReservation | undefined> {
    try {
      const reservationRef = ref(this.db, `seatReservations/${id}`);
      const snapshot = await get(reservationRef);
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting seat reservation:', error);
      return undefined;
    }
  }

  async getSeatReservations(): Promise<SeatReservation[]> {
    try {
      const reservationsRef = ref(this.db, 'seatReservations');
      const snapshot = await get(reservationsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => this.convertTimestampsToDates({ id, ...data[id] }));
      }
      return [];
    } catch (error) {
      console.error('Error getting seat reservations:', error);
      return [];
    }
  }

  async getSeatReservationsByDestination(destinationId: string): Promise<SeatReservation[]> {
    try {
      const reservationsRef = ref(this.db, 'seatReservations');
      const snapshot = await get(reservationsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data)
          .map(id => this.convertTimestampsToDates({ id, ...data[id] }))
          .filter((reservation: SeatReservation) => reservation.destination_id === destinationId);
      }
      return [];
    } catch (error) {
      console.error('Error getting seat reservations by destination:', error);
      return [];
    }
  }

  async getSeatReservationsWithClientsByDestination(destinationId: string): Promise<Array<SeatReservation & { client?: Client; is_child?: boolean; child_data?: Child; parent_client_id?: string }>> {
    try {
      const reservations = await this.getSeatReservationsByDestination(destinationId);
      
      // Get ALL children to build a map of child_id -> parent_client_id
      const allChildren = await this.getAllChildren();
      const childToParentMap = new Map<string, string>();
      const childDataMap = new Map<string, Child>();
      
      console.log(`[DEBUG PDF] Total children in system: ${allChildren.length}`);
      
      // Create a map from normalized child name to parent_client_id
      const childNameToParentMap = new Map<string, { parent_client_id: string; child_data: Child }>();
      
      const normalizeString = (str: string) => {
        return str
          .trim()
          .toUpperCase()
          .replace(/\s+/g, ' ')
          .replace(/\bDE\b/g, '')
          .replace(/\bDA\b/g, '')
          .replace(/\bDO\b/g, '')
          .replace(/\bDAS\b/g, '')
          .replace(/\bDOS\b/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };
      
      for (const child of allChildren) {
        childToParentMap.set(child.id, child.client_id);
        childDataMap.set(child.id, child);
        // Also map by normalized name for name-based matching
        const normalizedChildName = normalizeString(child.name);
        childNameToParentMap.set(normalizedChildName, { 
          parent_client_id: child.client_id, 
          child_data: child 
        });
      }
      
      console.log(`[DEBUG PDF] Total reservations for destination: ${reservations.length}`);
      console.log(`[DEBUG PDF] Child name map size: ${childNameToParentMap.size}`);
      
      // Fetch client data and check if passenger is a child/companion
      const reservationsWithClients = await Promise.all(
        reservations.map(async (reservation) => {
          let client = await this.getClient(reservation.client_id);
          let is_child = false;
          let child_data: Child | undefined = undefined;
          let parent_client_id = reservation.client_id;
          const normalizedReservationName = normalizeString(reservation.client_name || '');
          
          // Case 1: reservation.client_id is actually a child ID (old data stored as child_id)
          if (childToParentMap.has(reservation.client_id)) {
            parent_client_id = childToParentMap.get(reservation.client_id)!;
            is_child = true;
            child_data = childDataMap.get(reservation.client_id);
            // Get the parent client instead
            client = await this.getClient(parent_client_id);
            console.log(`[DEBUG PDF] Matched by child_id: "${reservation.client_name}" -> parent: ${parent_client_id}`);
          } 
          // Case 2: Check if the passenger name matches ANY child in the system (global name matching)
          else if (childNameToParentMap.has(normalizedReservationName)) {
            const match = childNameToParentMap.get(normalizedReservationName)!;
            parent_client_id = match.parent_client_id;
            is_child = true;
            child_data = match.child_data;
            client = await this.getClient(parent_client_id);
            console.log(`[DEBUG PDF] Matched by name: "${reservation.client_name}" -> parent: ${parent_client_id}`);
          }
          // Case 3: reservation.client_id is the parent's ID, check if the name matches a child of this specific client
          else if (client) {
            const children = await this.getChildrenByClientId(client.id);
            
            for (const child of children) {
              const normalizedChildName = normalizeString(child.name);
              if (normalizedChildName === normalizedReservationName) {
                is_child = true;
                child_data = child;
                console.log(`[DEBUG PDF] Matched child of client: "${reservation.client_name}" -> parent: ${client.id}`);
                break;
              }
            }
          }
          
          return { ...reservation, client, is_child, child_data, parent_client_id };
        })
      );
      
      return reservationsWithClients;
    } catch (error) {
      console.error('Error getting seat reservations with clients:', error);
      return [];
    }
  }

  async getAllPassengersByDestination(destinationName: string): Promise<Array<{ client_id: string; client_name: string; seat_number: string | null; client?: Client; is_child: boolean; child_id?: string; child_data?: Child; is_deleted?: boolean }>> {
    try {
      const destinations = await this.getDestinations();
      const destination = destinations.find(d => d.name === destinationName);
      if (!destination) {
        return [];
      }
      
      const seatReservations = await this.getSeatReservationsByDestination(destination.id);
      
      const normalizeString = (str: string) => {
        return str
          .trim()
          .toUpperCase()
          .replace(/\s+/g, ' ')
          .replace(/\bDE\b/g, '')
          .replace(/\bDA\b/g, '')
          .replace(/\bDO\b/g, '')
          .replace(/\bDAS\b/g, '')
          .replace(/\bDOS\b/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };
      
      // Build maps for reservation data by client_id and child_id
      const reservationByClientId = new Map<string, SeatReservation>();
      const reservationByChildName = new Map<string, SeatReservation>();
      const clientIdsWithReservations = new Set<string>();
      
      console.log(`[DEBUG] Processing ${seatReservations.length} seat reservations for ${destinationName}`);
      
      // Index reservations by client_id for merging (prefer first reservation if multiple exist)
      for (const reservation of seatReservations) {
        clientIdsWithReservations.add(reservation.client_id);
        // If child_id is set, this is a child reservation - store by child_id
        if (reservation.child_id) {
          if (!reservationByClientId.has(`child:${reservation.child_id}`)) {
            reservationByClientId.set(`child:${reservation.child_id}`, reservation);
          }
        } else {
          // Check if this might be a child reservation by matching name
          reservationByChildName.set(reservation.client_name.trim().toUpperCase(), reservation);
          if (!reservationByClientId.has(reservation.client_id)) {
            reservationByClientId.set(reservation.client_id, reservation);
          }
        }
      }
      
      // Use identity-based keys: client_id for main clients, child_id for children
      const passengers = new Map<string, { client_id: string; client_name: string; seat_number: string | null; client?: Client; is_child: boolean; child_id?: string; child_data?: Child; is_deleted?: boolean }>();
      
      // Get all clients for this destination
      const clients = await this.getClients();
      const destinationClients = clients.filter(c => 
        c.destination === destinationName && 
        !(c as any).is_deleted && 
        c.approval_status !== "cancelled"
      );
      
      for (const client of destinationClients) {
        const isClientDeleted = !!(client as any).is_deleted;
        const clientName = `${client.first_name} ${client.last_name}`;
        const hasReservation = clientIdsWithReservations.has(client.id);
        
        // Include client if: not deleted OR has reservation OR has seat_number
        if (!isClientDeleted || hasReservation || client.seat_number) {
          const reservation = reservationByClientId.get(client.id);
          const seatNumber = reservation?.seat_number || client.seat_number || null;
          
          if (isClientDeleted) {
            console.log(`[DEBUG] Including soft-deleted client: ${clientName} (seat: ${seatNumber})`);
          }
          
          passengers.set(`client:${client.id}`, {
            client_id: client.id,
            client_name: clientName,
            seat_number: seatNumber,
            client: client,
            is_child: false,
            is_deleted: isClientDeleted,
          });
          
          // Get children (for non-deleted clients, or if they have reservations)
          const children = await this.getChildrenByClientId(client.id);
          for (const child of children) {
            const childReservation = reservationByClientId.get(`child:${child.id}`) 
              || reservationByChildName.get(child.name.trim().toUpperCase());
            const childSeatNumber = childReservation?.seat_number || child.seat_number || null;
            
            passengers.set(`child:${child.id}`, {
              client_id: client.id,
              client_name: child.name,
              seat_number: childSeatNumber,
              client: client,
              is_child: true,
              child_id: child.id,
              child_data: child,
              is_deleted: false,
            });
          }
        }
      }
      
      // Also add any orphaned reservations (reservations for clients that don't exist anymore)
      for (const reservation of seatReservations) {
        const exists = passengers.has(`client:${reservation.client_id}`) 
          || (reservation.child_id && passengers.has(`child:${reservation.child_id}`));
        
        if (!exists && !reservation.child_id) {
          console.log(`[DEBUG] Adding orphaned reservation: ${reservation.client_name} (seat: ${reservation.seat_number})`);
          const client = await this.getClient(reservation.client_id);
          const isDeleted = client ? !!(client as any).is_deleted : true;
          
          passengers.set(`orphan:${reservation.id || reservation.client_id}:${reservation.seat_number}`, {
            client_id: reservation.client_id,
            client_name: reservation.client_name,
            seat_number: reservation.seat_number,
            client: client || undefined,
            is_child: false,
            is_deleted: isDeleted,
          });
        }
      }
      
      console.log(`[DEBUG] Final passenger count: ${passengers.size}`);
      return Array.from(passengers.values());
    } catch (error) {
      console.error('Error getting all passengers by destination:', error);
      return [];
    }
  }

  async getSeatReservationsByBus(busId: string): Promise<SeatReservation[]> {
    try {
      const reservationsRef = ref(this.db, 'seatReservations');
      const snapshot = await get(reservationsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data)
          .map(id => this.convertTimestampsToDates({ id, ...data[id] }))
          .filter((reservation: SeatReservation) => reservation.bus_id === busId);
      }
      return [];
    } catch (error) {
      console.error('Error getting seat reservations by bus:', error);
      return [];
    }
  }

  async createSeatReservation(reservation: InsertSeatReservation): Promise<SeatReservation> {
    try {
      const now = new Date();
      const newReservation: SeatReservation = {
        id: this.generateId(),
        ...reservation,
        created_at: now,
        updated_at: now,
      };

      const reservationRef = ref(this.db, `seatReservations/${newReservation.id}`);
      await set(reservationRef, this.convertDatesToTimestamp(newReservation));
      
      return newReservation;
    } catch (error) {
      console.error('Error creating seat reservation:', error);
      throw error;
    }
  }

  async updateSeatReservation(id: string, reservation: Partial<InsertSeatReservation>): Promise<SeatReservation> {
    try {
      const existingReservation = await this.getSeatReservation(id);
      if (!existingReservation) {
        throw new Error('Seat reservation not found');
      }

      const updatedReservation: SeatReservation = {
        ...existingReservation,
        ...reservation,
        updated_at: new Date(),
      };

      const reservationRef = ref(this.db, `seatReservations/${id}`);
      await set(reservationRef, this.convertDatesToTimestamp(updatedReservation));
      
      return updatedReservation;
    } catch (error) {
      console.error('Error updating seat reservation:', error);
      throw error;
    }
  }

  async deleteSeatReservation(id: string): Promise<void> {
    try {
      const reservationRef = ref(this.db, `seatReservations/${id}`);
      await remove(reservationRef);
    } catch (error) {
      console.error('Error deleting seat reservation:', error);
      throw error;
    }
  }

  async getSeatReservationByDestinationAndSeat(destinationId: string, seatNumber: string): Promise<SeatReservation | undefined> {
    try {
      const reservations = await this.getSeatReservationsByDestination(destinationId);
      const filteredReservations = await Promise.all(reservations.map(async (r) => {
        if (r.status === 'cancelled') return null;
        const client = await this.getClient(r.client_id);
        if (!client || (client as any).is_deleted || client.approval_status === "cancelled") return null;
        return r;
      }));
      return filteredReservations.find(r => r !== null && r.seat_number === seatNumber) as SeatReservation | undefined;
    } catch (error) {
      console.error('Error getting seat reservation by destination and seat:', error);
      return undefined;
    }
  }

  // Receipt operations
  async getReceipt(id: string): Promise<Receipt | undefined> {
    try {
      const receiptRef = ref(this.db, `receipts/${id}`);
      const snapshot = await get(receiptRef);
      if (!snapshot.exists()) return undefined;
      const data = snapshot.val();
      return this.convertTimestampsToDates(data) as Receipt;
    } catch (error) {
      console.error('Error getting receipt:', error);
      return undefined;
    }
  }

  async getReceipts(): Promise<Receipt[]> {
    try {
      const receiptsRef = ref(this.db, 'receipts');
      const snapshot = await get(receiptsRef);
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.values(data).map(receipt => this.convertTimestampsToDates(receipt)) as Receipt[];
    } catch (error) {
      console.error('Error getting receipts:', error);
      return [];
    }
  }

  async createReceipt(insertReceipt: InsertReceipt): Promise<Receipt> {
    try {
      const now = new Date();
      const receipt: Receipt = {
        id: this.generateId(),
        ...insertReceipt,
        created_at: now,
        updated_at: now,
      };

      const receiptRef = ref(this.db, `receipts/${receipt.id}`);
      await set(receiptRef, this.convertDatesToTimestamp(receipt));
      return receipt;
    } catch (error) {
      console.error('Error creating receipt:', error);
      throw new Error('Failed to create receipt');
    }
  }

  async updateReceipt(id: string, receiptUpdate: Partial<InsertReceipt>): Promise<Receipt> {
    try {
      const current = await this.getReceipt(id);
      if (!current) throw new Error('Receipt not found');
      
      const now = new Date();
      const updated: Receipt = {
        ...current,
        ...receiptUpdate,
        updated_at: now,
        // Sync created_at with payment_date if payment_date is being changed
        // This ensures the list view displays the updated date
        created_at: receiptUpdate.payment_date ? new Date(receiptUpdate.payment_date) : current.created_at,
      };

      const receiptRef = ref(this.db, `receipts/${id}`);
      await set(receiptRef, this.convertDatesToTimestamp(updated));
      return updated;
    } catch (error) {
      console.error('Error updating receipt:', error);
      throw new Error('Failed to update receipt');
    }
  }

  async deleteReceipt(id: string): Promise<void> {
    try {
      const receiptRef = ref(this.db, `receipts/${id}`);
      await remove(receiptRef);
    } catch (error) {
      console.error('Error deleting receipt:', error);
      throw new Error('Failed to delete receipt');
    }
  }

  // Parcela operations
  async getParcela(id: string): Promise<Parcela | undefined> {
    try {
      const parcelaRef = ref(this.db, `parcelas/${id}`);
      const snapshot = await get(parcelaRef);
      if (!snapshot.exists()) return undefined;
      const data = snapshot.val();
      return this.convertTimestampsToDates(data) as Parcela;
    } catch (error) {
      console.error('Error getting parcela:', error);
      return undefined;
    }
  }

  async getParcelas(): Promise<Parcela[]> {
    try {
      const parcelasRef = ref(this.db, 'parcelas');
      const snapshot = await get(parcelasRef);
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.values(data).map(parcela => this.convertTimestampsToDates(parcela)) as Parcela[];
    } catch (error) {
      console.error('Error getting parcelas:', error);
      return [];
    }
  }

  async getParcelasByClientId(clientId: string): Promise<Parcela[]> {
    try {
      const client = await this.getClient(clientId);
      if (!client || (client as any).is_deleted || client.approval_status === "cancelled") {
        return [];
      }
      const parcelas = await this.getParcelas();
      return parcelas.filter(p => p.client_id === clientId);
    } catch (error) {
      console.error('Error getting parcelas by client id:', error);
      return [];
    }
  }

  async getParcelasByMonth(month: number, year: number): Promise<Parcela[]> {
    try {
      const parcelas = await this.getParcelas();
      return parcelas.filter(p => {
        const dueDate = new Date(p.due_date);
        return dueDate.getMonth() + 1 === month && dueDate.getFullYear() === year;
      });
    } catch (error) {
      console.error('Error getting parcelas by month:', error);
      return [];
    }
  }

  async createParcela(insertParcela: InsertParcela): Promise<Parcela> {
    try {
      const now = new Date();
      const parcela: Parcela = {
        id: this.generateId(),
        ...insertParcela,
        created_at: now,
        updated_at: now,
      };

      const parcelaRef = ref(this.db, `parcelas/${parcela.id}`);
      await set(parcelaRef, this.convertDatesToTimestamp(parcela));
      return parcela;
    } catch (error) {
      console.error('Error creating parcela:', error);
      throw new Error('Failed to create parcela');
    }
  }

  async updateParcela(id: string, parcelaUpdate: Partial<InsertParcela>): Promise<Parcela> {
    try {
      const current = await this.getParcela(id);
      if (!current) throw new Error('Parcela not found');
      
      const now = new Date();
      const updated: Parcela = {
        ...current,
        ...parcelaUpdate,
        updated_at: now,
      };

      const parcelaRef = ref(this.db, `parcelas/${id}`);
      await set(parcelaRef, this.convertDatesToTimestamp(updated));
      return updated;
    } catch (error) {
      console.error('Error updating parcela:', error);
      throw new Error('Failed to update parcela');
    }
  }

  async deleteParcela(id: string): Promise<void> {
    try {
      const parcelaRef = ref(this.db, `parcelas/${id}`);
      await remove(parcelaRef);
    } catch (error) {
      console.error('Error deleting parcela:', error);
      throw new Error('Failed to delete parcela');
    }
  }

  async deleteParcelasByClientId(clientId: string): Promise<void> {
    try {
      const parcelas = await this.getParcelasByClientId(clientId);
      for (const parcela of parcelas) {
        await this.deleteParcela(parcela.id);
      }
    } catch (error) {
      console.error('Error deleting parcelas by client id:', error);
      throw new Error('Failed to delete parcelas');
    }
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    try {
      const departmentRef = ref(this.db, `departments/${id}`);
      const snapshot = await get(departmentRef);
      
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting department:', error);
      return undefined;
    }
  }

  async getDepartments(): Promise<Department[]> {
    try {
      const departmentsRef = ref(this.db, 'departments');
      const snapshot = await get(departmentsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data)
          .map(id => this.convertTimestampsToDates({ id, ...data[id] }))
          .sort((a, b) => a.order - b.order);
      }
      return [];
    } catch (error) {
      console.error('Error getting departments:', error);
      return [];
    }
  }

  async getActiveDepartments(): Promise<Department[]> {
    try {
      const departments = await this.getDepartments();
      return departments.filter(dept => dept.is_active);
    } catch (error) {
      console.error('Error getting active departments:', error);
      return [];
    }
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    try {
      const now = new Date();
      const department: Department = {
        id: this.generateId(),
        ...insertDepartment,
        created_at: now,
        updated_at: now,
      };

      const departmentRef = ref(this.db, `departments/${department.id}`);
      await set(departmentRef, this.convertDatesToTimestamp(department));
      
      return department;
    } catch (error) {
      console.error('Error creating department:', error);
      throw new Error('Failed to create department');
    }
  }

  async updateDepartment(id: string, departmentUpdate: Partial<InsertDepartment>): Promise<Department> {
    try {
      const current = await this.getDepartment(id);
      if (!current) throw new Error('Department not found');
      
      const now = new Date();
      const updated: Department = {
        ...current,
        ...departmentUpdate,
        updated_at: now,
      };
      
      const departmentRef = ref(this.db, `departments/${id}`);
      await set(departmentRef, this.convertDatesToTimestamp(updated));
      
      return updated;
    } catch (error) {
      console.error('Error updating department:', error);
      throw new Error('Failed to update department');
    }
  }

  async deleteDepartment(id: string): Promise<void> {
    try {
      const departmentRef = ref(this.db, `departments/${id}`);
      await remove(departmentRef);
    } catch (error) {
      console.error('Error deleting department:', error);
      throw new Error('Failed to delete department');
    }
  }

  // Time record operations
  async getTimeRecord(id: string): Promise<TimeRecord | undefined> {
    try {
      const timeRecordRef = ref(this.db, `timeRecords/${id}`);
      const snapshot = await get(timeRecordRef);
      
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting time record:', error);
      return undefined;
    }
  }

  async getTimeRecords(): Promise<TimeRecord[]> {
    try {
      const timeRecordsRef = ref(this.db, 'timeRecords');
      const snapshot = await get(timeRecordsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => 
          this.convertTimestampsToDates({ id, ...data[id] })
        );
      }
      return [];
    } catch (error) {
      console.error('Error getting time records:', error);
      return [];
    }
  }

  async getTimeRecordsByUserId(userId: string): Promise<TimeRecord[]> {
    try {
      const timeRecords = await this.getTimeRecords();
      return timeRecords.filter(record => record.user_id === userId);
    } catch (error) {
      console.error('Error getting time records by user ID:', error);
      return [];
    }
  }

  async getTimeRecordsByDateRange(startDate: string, endDate: string): Promise<TimeRecord[]> {
    try {
      const timeRecords = await this.getTimeRecords();
      return timeRecords.filter(record => 
        record.date >= startDate && record.date <= endDate
      );
    } catch (error) {
      console.error('Error getting time records by date range:', error);
      return [];
    }
  }

  async getTodayTimeRecord(userId: string): Promise<TimeRecord | undefined> {
    try {
      const today = this.getLocalDateString(); // YYYY-MM-DD in local timezone
      const timeRecords = await this.getTimeRecordsByUserId(userId);
      return timeRecords.find(record => record.date === today);
    } catch (error) {
      console.error('Error getting today time record:', error);
      return undefined;
    }
  }

  async createTimeRecord(insertTimeRecord: InsertTimeRecord): Promise<TimeRecord> {
    try {
      const now = new Date();
      const timeRecord: TimeRecord = {
        id: this.generateId(),
        ...insertTimeRecord,
        created_at: now,
        updated_at: now,
      };

      const { id, ...timeRecordDataWithoutId } = timeRecord;
      const timeRecordRef = ref(this.db, `timeRecords/${timeRecord.id}`);
      await set(timeRecordRef, this.convertDatesToTimestamp(timeRecordDataWithoutId));
      
      return timeRecord;
    } catch (error) {
      console.error('Error creating time record:', error);
      throw new Error('Failed to create time record');
    }
  }

  async updateTimeRecord(id: string, timeRecordUpdate: Partial<InsertTimeRecord>): Promise<TimeRecord> {
    try {
      const existingTimeRecord = await this.getTimeRecord(id);
      if (!existingTimeRecord) {
        throw new Error('Time record not found');
      }

      const now = new Date();
      const updatedTimeRecord: TimeRecord = {
        ...existingTimeRecord,
        ...timeRecordUpdate,
        updated_at: now,
      };

      const { id: _, ...timeRecordDataWithoutId } = updatedTimeRecord;
      const timeRecordRef = ref(this.db, `timeRecords/${id}`);
      await set(timeRecordRef, this.convertDatesToTimestamp(timeRecordDataWithoutId));
      
      return updatedTimeRecord;
    } catch (error) {
      console.error('Error updating time record:', error);
      throw new Error('Failed to update time record');
    }
  }

  async deleteTimeRecord(id: string): Promise<void> {
    try {
      const timeRecordRef = ref(this.db, `timeRecords/${id}`);
      await remove(timeRecordRef);
    } catch (error) {
      console.error('Error deleting time record:', error);
      throw new Error('Failed to delete time record');
    }
  }

  // Facial verification session operations
  async getFacialVerificationSession(id: string): Promise<FacialVerificationSession | undefined> {
    try {
      const sessionRef = ref(this.db, `facialVerificationSessions/${id}`);
      const snapshot = await get(sessionRef);
      
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting facial verification session:', error);
      return undefined;
    }
  }

  async getFacialVerificationSessionByToken(token: string): Promise<FacialVerificationSession | undefined> {
    try {
      const sessionsRef = ref(this.db, 'facialVerificationSessions');
      const snapshot = await get(sessionsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const sessions: FacialVerificationSession[] = Object.keys(data).map(id => 
          this.convertTimestampsToDates({ id, ...data[id] })
        );
        return sessions.find(session => session.verification_token === token);
      }
      return undefined;
    } catch (error) {
      console.error('Error getting facial verification session by token:', error);
      return undefined;
    }
  }

  async createFacialVerificationSession(insertSession: InsertFacialVerificationSession): Promise<FacialVerificationSession> {
    try {
      const now = new Date();
      const session: FacialVerificationSession = {
        id: this.generateId(),
        ...insertSession,
        created_at: now,
        updated_at: now,
      };

      const { id, ...sessionDataWithoutId } = session;
      const sessionRef = ref(this.db, `facialVerificationSessions/${session.id}`);
      await set(sessionRef, this.convertDatesToTimestamp(sessionDataWithoutId));
      
      return session;
    } catch (error) {
      console.error('Error creating facial verification session:', error);
      throw new Error('Failed to create facial verification session');
    }
  }

  async updateFacialVerificationSession(id: string, sessionUpdate: Partial<InsertFacialVerificationSession>): Promise<FacialVerificationSession> {
    try {
      const existingSession = await this.getFacialVerificationSession(id);
      if (!existingSession) {
        throw new Error('Facial verification session not found');
      }

      const now = new Date();
      const updatedSession: FacialVerificationSession = {
        ...existingSession,
        ...sessionUpdate,
        updated_at: now,
      };

      const { id: _, ...sessionDataWithoutId } = updatedSession;
      const sessionRef = ref(this.db, `facialVerificationSessions/${id}`);
      await set(sessionRef, this.convertDatesToTimestamp(sessionDataWithoutId));
      
      return updatedSession;
    } catch (error) {
      console.error('Error updating facial verification session:', error);
      throw new Error('Failed to update facial verification session');
    }
  }

  async deleteFacialVerificationSession(id: string): Promise<void> {
    try {
      const sessionRef = ref(this.db, `facialVerificationSessions/${id}`);
      await remove(sessionRef);
    } catch (error) {
      console.error('Error deleting facial verification session:', error);
      throw new Error('Failed to delete facial verification session');
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      const sessionsRef = ref(this.db, 'facialVerificationSessions');
      const snapshot = await get(sessionsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const now = new Date();
        const expiredSessionIds: string[] = [];
        
        Object.keys(data).forEach(id => {
          const session = this.convertTimestampsToDates({ id, ...data[id] });
          if (new Date(session.expires_at) < now && session.status === 'pending') {
            expiredSessionIds.push(id);
          }
        });

        // Delete expired sessions
        for (const id of expiredSessionIds) {
          await this.updateFacialVerificationSession(id, { status: 'expired' });
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }

  // CRM Task operations
  async getCrmTask(id: string): Promise<CrmTask | undefined> {
    try {
      const taskRef = ref(this.db, `crmTasks/${id}`);
      const snapshot = await get(taskRef);
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting CRM task:', error);
      return undefined;
    }
  }

  async getCrmTasks(): Promise<CrmTask[]> {
    try {
      const tasksRef = ref(this.db, 'crmTasks');
      const snapshot = await get(tasksRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => 
          this.convertTimestampsToDates({ id, ...data[id] })
        );
      }
      return [];
    } catch (error) {
      console.error('Error getting CRM tasks:', error);
      return [];
    }
  }

  async getCrmTasksByUserId(userId: string): Promise<CrmTask[]> {
    try {
      const tasks = await this.getCrmTasks();
      return tasks.filter(task => task.assigned_to_user_id === userId);
    } catch (error) {
      console.error('Error getting CRM tasks by user:', error);
      return [];
    }
  }

  async getCrmTasksCreatedBy(userId: string): Promise<CrmTask[]> {
    try {
      const tasks = await this.getCrmTasks();
      return tasks.filter(task => task.assigned_by_user_id === userId);
    } catch (error) {
      console.error('Error getting CRM tasks created by user:', error);
      return [];
    }
  }

  async createCrmTask(insertTask: InsertCrmTask): Promise<CrmTask> {
    try {
      const now = new Date();
      const checklist = insertTask.checklist || [];
      const completedItems = checklist.filter(item => item.done).length;
      const totalItems = checklist.length;
      const completion_percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      
      const task: CrmTask = {
        id: this.generateId(),
        ...insertTask,
        status: 'pending',
        completion_percentage,
        created_at: now,
        updated_at: now,
      };
      const { id, ...taskDataWithoutId } = task;
      const taskRef = ref(this.db, `crmTasks/${task.id}`);
      await set(taskRef, this.convertDatesToTimestamp(taskDataWithoutId));
      return task;
    } catch (error) {
      console.error('Error creating CRM task:', error);
      throw error;
    }
  }

  async updateCrmTask(id: string, updates: Partial<InsertCrmTask> & { status?: 'pending' | 'in_progress' | 'completed'; completed_at?: Date | null; completion_percentage?: number }): Promise<CrmTask> {
    try {
      const task = await this.getCrmTask(id);
      if (!task) throw new Error('Task not found');
      
      const now = new Date();
      
      const checklist = updates.checklist !== undefined ? updates.checklist : task.checklist || [];
      const completedItems = checklist.filter(item => item.done).length;
      const totalItems = checklist.length;
      const autoPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : (updates.completion_percentage ?? task.completion_percentage ?? 0);
      
      const updated: CrmTask = {
        ...task,
        ...updates,
        completion_percentage: updates.checklist !== undefined ? autoPercentage : (updates.completion_percentage ?? task.completion_percentage ?? 0),
        updated_at: now,
      };
      const { id: _, ...taskDataWithoutId } = updated;
      const taskRef = ref(this.db, `crmTasks/${id}`);
      await set(taskRef, this.convertDatesToTimestamp(taskDataWithoutId));
      return updated;
    } catch (error) {
      console.error('Error updating CRM task:', error);
      throw error;
    }
  }

  async deleteCrmTask(id: string): Promise<void> {
    try {
      const taskRef = ref(this.db, `crmTasks/${id}`);
      await remove(taskRef);
    } catch (error) {
      console.error('Error deleting CRM task:', error);
      throw error;
    }
  }

  // Notification operations
  async getNotifications(userEmail: string, unreadOnly?: boolean): Promise<Notification[]> {
    try {
      const notificationsRef = ref(this.db, 'notifications');
      const snapshot = await get(notificationsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        let notifications = Object.keys(data)
          .map(id => this.convertTimestampsToDates({ id, ...data[id] }))
          .filter(n => n.user_email === userEmail);
        
        if (unreadOnly) {
          notifications = notifications.filter(n => !n.read);
        }
        return notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    try {
      const now = new Date();
      const notification: Notification = {
        id: this.generateId(),
        ...insertNotification,
        read: false,
        created_at: now,
        updated_at: now,
      };
      const { id, ...notificationDataWithoutId } = notification;
      const notificationRef = ref(this.db, `notifications/${notification.id}`);
      await set(notificationRef, this.convertDatesToTimestamp(notificationDataWithoutId));
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    try {
      const notification = await this.getNotification(notificationId);
      if (!notification) throw new Error('Notification not found');
      
      const now = new Date();
      const updated: Notification = {
        ...notification,
        read: true,
        updated_at: now,
      };
      const { id: _, ...notificationDataWithoutId } = updated;
      const notificationRef = ref(this.db, `notifications/${notificationId}`);
      await set(notificationRef, this.convertDatesToTimestamp(notificationDataWithoutId));
      return updated;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  private async getNotification(id: string): Promise<Notification | undefined> {
    try {
      const notificationRef = ref(this.db, `notifications/${id}`);
      const snapshot = await get(notificationRef);
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting notification:', error);
      return undefined;
    }
  }

  // Bill operations (Contas a Pagar e a Receber)
  async getBill(id: string): Promise<Bill | undefined> {
    try {
      const billRef = ref(this.db, `bills/${id}`);
      const snapshot = await get(billRef);
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting bill:', error);
      return undefined;
    }
  }

  async getBills(type?: "pagar" | "receber"): Promise<Bill[]> {
    try {
      const billsRef = ref(this.db, 'bills');
      const snapshot = await get(billsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        let bills = Object.keys(data).map(id => this.convertTimestampsToDates({ id, ...data[id] }));
        if (type) {
          bills = bills.filter(b => b.type === type);
        }
        // Update status based on due date
        const now = new Date();
        bills = bills.map(bill => {
          if (bill.status !== "paid" && new Date(bill.due_date) < now) {
            bill.status = "overdue";
          }
          return bill;
        });
        return bills.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
      }
      return [];
    } catch (error) {
      console.error('Error getting bills:', error);
      return [];
    }
  }

  async getBillsByStatus(status: "pending" | "paid" | "overdue"): Promise<Bill[]> {
    try {
      const bills = await this.getBills();
      return bills.filter(b => b.status === status);
    } catch (error) {
      console.error('Error getting bills by status:', error);
      return [];
    }
  }

  async createBill(insertBill: InsertBill & { created_by_email: string; created_by_name: string }): Promise<Bill> {
    try {
      const now = new Date();
      const bill: Bill = {
        id: this.generateId(),
        ...insertBill,
        status: "pending",
        created_at: now,
        updated_at: now,
      };
      const { id, ...billDataWithoutId } = bill;
      const billRef = ref(this.db, `bills/${bill.id}`);
      await set(billRef, this.convertDatesToTimestamp(billDataWithoutId));
      return bill;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  }

  async updateBill(id: string, updates: Partial<InsertBill> & { status?: "pending" | "paid" | "overdue"; paid_at?: Date | null }): Promise<Bill> {
    try {
      const bill = await this.getBill(id);
      if (!bill) throw new Error('Bill not found');
      
      const now = new Date();
      const updated: Bill = {
        ...bill,
        ...updates,
        updated_at: now,
      };
      const { id: _, ...billDataWithoutId } = updated;
      const billRef = ref(this.db, `bills/${id}`);
      await set(billRef, this.convertDatesToTimestamp(billDataWithoutId));
      return updated;
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  async deleteBill(id: string): Promise<void> {
    try {
      const billRef = ref(this.db, `bills/${id}`);
      await remove(billRef);
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  }

  async checkAndCreateBillReminders(): Promise<void> {
    try {
      const bills = await this.getBills();
      const now = new Date();
      const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      
      for (const bill of bills) {
        if (bill.status === "pending") {
          const billDate = new Date(bill.due_date);
          // Check if bill is due within 5 days
          if (billDate > now && billDate <= fiveDaysFromNow) {
            // Check if reminder already sent (avoid duplicates)
            const existingNotifications = await this.getNotifications(bill.created_by_email, true);
            const reminderExists = existingNotifications.some(n => 
              n.related_id === bill.id && n.type === "payment_reminder"
            );
            
            if (!reminderExists) {
              await this.createNotification({
                user_email: bill.created_by_email,
                type: "payment_reminder",
                title: "Lembrete: Conta Vencendo",
                message: `${bill.title} vence em ${new Date(bill.due_date).toLocaleDateString('pt-BR')} - R$ ${bill.amount.toFixed(2)}`,
                related_id: bill.id,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking bill reminders:', error);
    }
  }

  // Funcionário operations (using RH database - cidade-dofuturo)
  async getFuncionario(id: string): Promise<Funcionario | undefined> {
    try {
      const funcionarioRef = ref(this.dbRh, `funcionarios/${id}`);
      const snapshot = await get(funcionarioRef);
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting funcionário:', error);
      return undefined;
    }
  }

  async getFuncionarios(): Promise<Funcionario[]> {
    try {
      const funcionariosRef = ref(this.dbRh, 'funcionarios');
      const snapshot = await get(funcionariosRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => 
          this.convertTimestampsToDates({ id, ...data[id] })
        );
      }
      return [];
    } catch (error) {
      console.error('Error getting funcionários:', error);
      return [];
    }
  }

  async getActiveFuncionarios(): Promise<Funcionario[]> {
    try {
      const funcionarios = await this.getFuncionarios();
      return funcionarios.filter(f => f.is_active);
    } catch (error) {
      console.error('Error getting active funcionários:', error);
      return [];
    }
  }

  async getTrialFuncionarios(): Promise<Funcionario[]> {
    try {
      const funcionarios = await this.getFuncionarios();
      return funcionarios.filter(f => f.trial_status === 'active' || f.trial_status === 'pending');
    } catch (error) {
      console.error('Error getting trial funcionários:', error);
      return [];
    }
  }

  async createFuncionario(insertFuncionario: InsertFuncionario): Promise<Funcionario> {
    try {
      const funcionariosRef = ref(this.dbRh, 'funcionarios');
      const newFuncionarioRef = push(funcionariosRef);
      const now = new Date();
      
      const funcionario: Funcionario = {
        id: newFuncionarioRef.key!,
        ...insertFuncionario,
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      await set(newFuncionarioRef, this.convertDatesToTimestamp(funcionario));
      return funcionario;
    } catch (error) {
      console.error('Error creating funcionário:', error);
      throw error;
    }
  }

  async createTrialFuncionario(insertFuncionario: InsertFuncionario & { trial_period_days: number }): Promise<Funcionario> {
    try {
      const funcionariosRef = ref(this.dbRh, 'funcionarios');
      const newFuncionarioRef = push(funcionariosRef);
      const now = new Date();
      
      const funcionario: Funcionario = {
        id: newFuncionarioRef.key!,
        ...insertFuncionario,
        is_active: true,
        trial_status: 'active',
        trial_start_date: now,
        trial_period_days: insertFuncionario.trial_period_days,
        created_at: now,
        updated_at: now,
      };

      await set(newFuncionarioRef, this.convertDatesToTimestamp(funcionario));
      return funcionario;
    } catch (error) {
      console.error('Error creating trial funcionário:', error);
      throw error;
    }
  }

  async updateFuncionario(id: string, updates: Partial<InsertFuncionario>): Promise<Funcionario> {
    try {
      const funcionario = await this.getFuncionario(id);
      if (!funcionario) throw new Error('Funcionário not found');

      const updatedFuncionario: Funcionario = {
        ...funcionario,
        ...updates,
        updated_at: new Date(),
      };

      const funcionarioRef = ref(this.dbRh, `funcionarios/${id}`);
      await set(funcionarioRef, this.convertDatesToTimestamp(updatedFuncionario));
      return updatedFuncionario;
    } catch (error) {
      console.error('Error updating funcionário:', error);
      throw error;
    }
  }

  async activateTrialFuncionario(id: string): Promise<Funcionario> {
    try {
      const funcionario = await this.getFuncionario(id);
      if (!funcionario) throw new Error('Funcionário not found');

      const updatedFuncionario: Funcionario = {
        ...funcionario,
        trial_status: 'completed',
        updated_at: new Date(),
      };

      const funcionarioRef = ref(this.dbRh, `funcionarios/${id}`);
      await set(funcionarioRef, this.convertDatesToTimestamp(updatedFuncionario));
      return updatedFuncionario;
    } catch (error) {
      console.error('Error activating trial funcionário:', error);
      throw error;
    }
  }

  async terminateFuncionario(id: string, terminationReason: string): Promise<Funcionario> {
    try {
      const funcionario = await this.getFuncionario(id);
      if (!funcionario) throw new Error('Funcionário not found');

      const updatedFuncionario: Funcionario = {
        ...funcionario,
        is_active: false,
        termination_date: new Date(),
        termination_reason: terminationReason,
        updated_at: new Date(),
      };

      const funcionarioRef = ref(this.dbRh, `funcionarios/${id}`);
      await set(funcionarioRef, this.convertDatesToTimestamp(updatedFuncionario));
      return updatedFuncionario;
    } catch (error) {
      console.error('Error terminating funcionário:', error);
      throw error;
    }
  }

  async deleteFuncionario(id: string): Promise<void> {
    try {
      const funcionarioRef = ref(this.dbRh, `funcionarios/${id}`);
      await remove(funcionarioRef);
    } catch (error) {
      console.error('Error deleting funcionário:', error);
      throw error;
    }
  }

  // Proposal operations (RH database only - cidade-dofuturo)
  async getProposal(id: string): Promise<Proposal | undefined> {
    try {
      const proposalRef = ref(this.dbRh, `proposals/${id}`);
      const snapshot = await get(proposalRef);
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting proposal:', error);
      return undefined;
    }
  }

  async getProposals(): Promise<Proposal[]> {
    try {
      const proposalsRef = ref(this.dbRh, 'proposals');
      const snapshot = await get(proposalsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => 
          this.convertTimestampsToDates({ id, ...data[id] })
        );
      }
      return [];
    } catch (error) {
      console.error('Error getting proposals:', error);
      return [];
    }
  }

  async createProposal(proposal: Proposal): Promise<Proposal> {
    try {
      const proposalRef = ref(this.dbRh, `proposals/${proposal.id}`);
      await set(proposalRef, this.convertDatesToTimestamp(proposal));
      return proposal;
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  }

  async deleteProposal(id: string): Promise<void> {
    try {
      const proposalRef = ref(this.dbRh, `proposals/${id}`);
      await remove(proposalRef);
    } catch (error) {
      console.error('Error deleting proposal:', error);
      throw error;
    }
  }

  // Cancelled Client Credit operations
  async getCancelledClientCredit(id: string): Promise<CancelledClientCredit | undefined> {
    try {
      const creditRef = ref(this.db, `cancelledClientCredits/${id}`);
      const snapshot = await get(creditRef);
      if (snapshot.exists()) {
        return this.convertTimestampsToDates({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting cancelled client credit:', error);
      return undefined;
    }
  }

  async getCancelledClientCredits(): Promise<CancelledClientCredit[]> {
    try {
      const creditsRef = ref(this.db, 'cancelledClientCredits');
      const snapshot = await get(creditsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => this.convertTimestampsToDates({ id, ...data[id] }));
      }
      return [];
    } catch (error) {
      console.error('Error getting cancelled client credits:', error);
      return [];
    }
  }

  async getCancelledClientCreditsByClientId(clientId: string): Promise<CancelledClientCredit[]> {
    try {
      const credits = await this.getCancelledClientCredits();
      return credits.filter(c => c.client_id === clientId);
    } catch (error) {
      console.error('Error getting cancelled client credits by client id:', error);
      return [];
    }
  }

  async getActiveCancelledClientCredits(): Promise<CancelledClientCredit[]> {
    try {
      const credits = await this.getCancelledClientCredits();
      return credits.filter(c => !c.is_expired && !c.is_used);
    } catch (error) {
      console.error('Error getting active cancelled client credits:', error);
      return [];
    }
  }

  async getExpiredCancelledClientCredits(): Promise<CancelledClientCredit[]> {
    try {
      const credits = await this.getCancelledClientCredits();
      return credits.filter(c => c.is_expired);
    } catch (error) {
      console.error('Error getting expired cancelled client credits:', error);
      return [];
    }
  }

  async createCancelledClientCredit(credit: InsertCancelledClientCredit): Promise<CancelledClientCredit> {
    try {
      const creditsRef = ref(this.db, 'cancelledClientCredits');
      const newCreditRef = push(creditsRef);
      const now = new Date();
      const newCredit: CancelledClientCredit = {
        ...credit,
        id: newCreditRef.key!,
        is_expired: false,
        is_used: false,
        created_at: now,
        updated_at: now,
      };
      await set(newCreditRef, this.convertDatesToTimestamp(newCredit));
      return newCredit;
    } catch (error) {
      console.error('Error creating cancelled client credit:', error);
      throw error;
    }
  }

  async updateCancelledClientCredit(id: string, credit: Partial<CancelledClientCredit>): Promise<CancelledClientCredit> {
    try {
      const existing = await this.getCancelledClientCredit(id);
      if (!existing) throw new Error('Cancelled client credit not found');
      const updated = { ...existing, ...credit, updated_at: new Date() };
      const creditRef = ref(this.db, `cancelledClientCredits/${id}`);
      await set(creditRef, this.convertDatesToTimestamp(updated));
      return updated;
    } catch (error) {
      console.error('Error updating cancelled client credit:', error);
      throw error;
    }
  }

  async markCreditAsUsed(id: string, usedForClientId: string): Promise<CancelledClientCredit> {
    return this.updateCancelledClientCredit(id, {
      is_used: true,
      used_at: new Date(),
      used_for_client_id: usedForClientId,
    });
  }

  async updateExpiredCredits(): Promise<number> {
    try {
      const credits = await this.getCancelledClientCredits();
      const now = new Date();
      let expiredCount = 0;
      for (const credit of credits) {
        if (!credit.is_expired && !credit.is_used && new Date(credit.expires_at) < now) {
          await this.updateCancelledClientCredit(credit.id, { is_expired: true });
          expiredCount++;
        }
      }
      return expiredCount;
    } catch (error) {
      console.error('Error updating expired credits:', error);
      return 0;
    }
  }

  async cancelClient(clientId: string, reason: string, cancelledByEmail: string, cancelledByName: string): Promise<{
    client: Client;
    credit: CancelledClientCredit;
    cancelledReceipts: Receipt[];
    removedSeatReservations: SeatReservation[];
  }> {
    const client = await this.getClient(clientId);
    if (!client) throw new Error('Client not found');

    // Get all receipts for this client, excluding those paid with credits from previous trips
    // (credits from previous trips are already counted as old money, not new income)
    const allReceipts = await this.getReceipts();
    const clientReceipts = allReceipts.filter(r => 
      r.client_id === clientId && 
      r.payment_method !== 'credito_viagens_anteriores'
    );
    const receiptsTotal = clientReceipts.reduce((sum, r) => sum + r.amount, 0);
    
    // Include the down_payment (entrada) ONLY if it was NOT paid with credit from previous trips
    // Credits from previous trips are already recorded money, shouldn't be counted again
    const isEntradaPaidWithCredit = client.down_payment_method === 'credito_viagens_anteriores';
    const downPaymentAmount = isEntradaPaidWithCredit ? 0 : (client.down_payment || 0);
    const totalPaid = receiptsTotal + downPaymentAmount;

    // Get seat reservations for this client
    const allReservations = await this.getSeatReservations();
    const clientReservations = allReservations.filter(r => r.client_id === clientId);

    // Remove seat reservations
    for (const reservation of clientReservations) {
      await this.deleteSeatReservation(reservation.id);
    }

    // Create cancelled client credit (90 days expiration)
    const cancelledAt = new Date();
    const expiresAt = new Date(cancelledAt);
    expiresAt.setDate(expiresAt.getDate() + 90);

    const credit = await this.createCancelledClientCredit({
      client_id: clientId,
      client_name: `${client.first_name} ${client.last_name}`,
      client_phone: client.phone,
      client_email: client.email,
      destination: client.destination,
      original_travel_date: client.travel_date,
      total_paid: totalPaid,
      credit_amount: totalPaid,
      cancellation_reason: reason,
      cancelled_at: cancelledAt,
      expires_at: expiresAt,
      cancelled_by_email: cancelledByEmail,
      cancelled_by_name: cancelledByName,
      receipt_ids: clientReceipts.map(r => r.id),
    });

    // Update client as cancelled
    const updatedClient = await this.updateClient(clientId, {
      is_cancelled: true,
      cancelled_at: cancelledAt,
      cancellation_reason: reason,
      cancelled_by_email: cancelledByEmail,
      cancelled_by_name: cancelledByName,
    } as any);

    return {
      client: updatedClient,
      credit,
      cancelledReceipts: clientReceipts,
      removedSeatReservations: clientReservations,
    };
  }

  private normalizeDiscountApprovalRequest(data: any): DiscountApprovalRequest {
    const normalized = this.convertTimestampsToDates(data);
    // Ensure numeric fields are numbers, not strings
    return {
      ...normalized,
      amount_client_will_pay: typeof normalized.amount_client_will_pay === 'string' 
        ? parseFloat(normalized.amount_client_will_pay) 
        : normalized.amount_client_will_pay,
      requested_discount_percentage: typeof normalized.requested_discount_percentage === 'string'
        ? parseFloat(normalized.requested_discount_percentage)
        : normalized.requested_discount_percentage,
      max_discount_percentage_allowed: normalized.max_discount_percentage_allowed
        ? (typeof normalized.max_discount_percentage_allowed === 'string'
          ? parseFloat(normalized.max_discount_percentage_allowed)
          : normalized.max_discount_percentage_allowed)
        : undefined,
    };
  }

  async getDiscountApprovalRequest(id: string): Promise<DiscountApprovalRequest | undefined> {
    try {
      const requestRef = ref(this.db, `discountApprovalRequests/${id}`);
      const snapshot = await get(requestRef);
      
      if (snapshot.exists()) {
        return this.normalizeDiscountApprovalRequest({ id, ...snapshot.val() });
      }
      return undefined;
    } catch (error) {
      console.error('Error getting discount approval request:', error);
      return undefined;
    }
  }

  async getDiscountApprovalRequests(): Promise<DiscountApprovalRequest[]> {
    try {
      const requestsRef = ref(this.db, 'discountApprovalRequests');
      const snapshot = await get(requestsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => 
          this.normalizeDiscountApprovalRequest({ id, ...data[id] })
        );
      }
      return [];
    } catch (error) {
      console.error('Error getting discount approval requests:', error);
      return [];
    }
  }

  async getPendingDiscountApprovalRequests(): Promise<DiscountApprovalRequest[]> {
    try {
      const requestsRef = ref(this.db, 'discountApprovalRequests');
      const pendingQuery = query(requestsRef, orderByChild('status'), equalTo('pending'));
      const snapshot = await get(pendingQuery);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => 
          this.normalizeDiscountApprovalRequest({ id, ...data[id] })
        );
      }
      return [];
    } catch (error) {
      console.error('Error getting pending discount approval requests:', error);
      return [];
    }
  }

  async createDiscountApprovalRequest(request: InsertDiscountApprovalRequest): Promise<DiscountApprovalRequest> {
    try {
      const requestsRef = ref(this.db, 'discountApprovalRequests');
      const newRequestRef = push(requestsRef);
      const now = new Date();
      
      const discountRequest: DiscountApprovalRequest = {
        id: newRequestRef.key!,
        ...request,
        status: 'pending',
        created_at: now,
        updated_at: now,
      };
      
      await set(newRequestRef, this.convertDatesToTimestamp(discountRequest));
      return discountRequest;
    } catch (error) {
      console.error('Error creating discount approval request:', error);
      throw new Error('Failed to create discount approval request');
    }
  }

  async approveDiscountRequest(
    id: string, 
    vadminId: string, 
    vadminName: string, 
    maxDiscountPercentage: number
  ): Promise<DiscountApprovalRequest> {
    try {
      const requestRef = ref(this.db, `discountApprovalRequests/${id}`);
      const snapshot = await get(requestRef);
      
      if (!snapshot.exists()) {
        throw new Error('Discount approval request not found');
      }
      
      const now = new Date();
      const updatedRequest: DiscountApprovalRequest = {
        ...this.convertTimestampsToDates({ id, ...snapshot.val() }),
        status: 'approved',
        approved_by_vadmin_id: vadminId,
        approved_by_vadmin_name: vadminName,
        max_discount_percentage_allowed: maxDiscountPercentage,
        approved_at: now,
        updated_at: now,
      };
      
      await set(requestRef, this.convertDatesToTimestamp(updatedRequest));
      return updatedRequest;
    } catch (error) {
      console.error('Error approving discount request:', error);
      throw new Error('Failed to approve discount request');
    }
  }

  async rejectDiscountRequest(
    id: string, 
    vadminId: string, 
    vadminName: string, 
    reason?: string
  ): Promise<DiscountApprovalRequest> {
    try {
      const requestRef = ref(this.db, `discountApprovalRequests/${id}`);
      const snapshot = await get(requestRef);
      
      if (!snapshot.exists()) {
        throw new Error('Discount approval request not found');
      }
      
      const now = new Date();
      const updatedRequest: DiscountApprovalRequest = {
        ...this.convertTimestampsToDates({ id, ...snapshot.val() }),
        status: 'rejected',
        approved_by_vadmin_id: vadminId,
        approved_by_vadmin_name: vadminName,
        rejection_reason: reason,
        updated_at: now,
      };
      
      await set(requestRef, this.convertDatesToTimestamp(updatedRequest));
      return updatedRequest;
    } catch (error) {
      console.error('Error rejecting discount request:', error);
      throw new Error('Failed to reject discount request');
    }
  }

  async deleteDiscountApprovalRequest(id: string): Promise<void> {
    try {
      const requestRef = ref(this.db, `discountApprovalRequests/${id}`);
      await remove(requestRef);
    } catch (error) {
      console.error('Error deleting discount approval request:', error);
      throw new Error('Failed to delete discount approval request');
    }
  }

  async getInvitationLink(linkToken: string): Promise<InvitationLink | undefined> {
    try {
      // Use link_token as the key directly to avoid needing a database index
      const linkRef = ref(this.db, `invitationLinks/${linkToken}`);
      const snapshot = await get(linkRef);
      if (!snapshot.exists()) return undefined;
      return this.convertTimestampsToDates({ id: linkToken, ...snapshot.val() });
    } catch (error) {
      console.error('Error getting invitation link:', error);
      return undefined;
    }
  }

  async createInvitationLink(link: InsertInvitationLink): Promise<InvitationLink> {
    try {
      const linkToken = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const invitationLink: InvitationLink = {
        id: linkToken,
        link_token: linkToken,
        ...link,
        created_at: now,
        used_count: 0,
      };
      // Use link_token as the key directly to avoid needing a database index
      const linkRef = ref(this.db, `invitationLinks/${linkToken}`);
      await set(linkRef, this.convertDatesToTimestamp(invitationLink));
      return invitationLink;
    } catch (error) {
      console.error('Error creating invitation link:', error);
      throw new Error('Failed to create invitation link');
    }
  }

  async updateInvitationLinkUsage(linkToken: string): Promise<InvitationLink | undefined> {
    try {
      const link = await this.getInvitationLink(linkToken);
      if (!link) return undefined;
      const linkRef = ref(this.db, `invitationLinks/${linkToken}`);
      const updated = {
        ...link,
        used_count: (link.used_count || 0) + 1,
        last_used_at: new Date(),
      };
      await set(linkRef, this.convertDatesToTimestamp(updated));
      return this.convertTimestampsToDates(updated);
    } catch (error) {
      console.error('Error updating invitation link usage:', error);
      return undefined;
    }
  }

  async convertProspectToClient(prospectId: string): Promise<{ prospect: Prospect; client: Client }> {
    try {
      const prospect = await this.getProspect(prospectId);
      if (!prospect) {
        throw new Error('Prospect not found');
      }

      if (prospect.is_converted) {
        throw new Error('Prospect has already been converted to a client');
      }

      // Create client from prospect data
      const clientData: InsertClient = {
        first_name: prospect.first_name,
        last_name: prospect.last_name,
        birthdate: new Date(), // Default birthdate, should be updated later
        cpf: '', // Will need to be filled by admin
        phone: prospect.phone,
        email: prospect.email,
        destination: prospect.destination,
        duration: prospect.duration,
        quantity: prospect.quantity,
        travel_date: prospect.travel_date,
        travel_price: prospect.quote_price,
        contract_type: "normal", // Default contract type
        client_type: "agencia", // Default to agency client
      };

      const client = await this.createClient(clientData);

      // Mark prospect as converted
      const updatedProspect = await this.updateProspect(prospectId, {
        is_converted: true,
        converted_client_id: client.id,
        converted_at: new Date(),
        quote_status: "accepted",
      });

      return { prospect: updatedProspect, client };
    } catch (error) {
      console.error('Error converting prospect to client:', error);
      throw error;
    }
  }
}

// Firebase Admin Storage Implementation (for production)
class FirestoreStorage implements IStorage {
  private admin: any;
  private db: any;

  constructor() {
    this.initializeFirestore();
  }

  private async initializeFirestore() {
    try {
      // Dynamic import to handle potential failures
      const admin = await import('firebase-admin');
      this.admin = admin.default || admin;
      
      if (this.admin.apps.length === 0) {
        if (process.env.NODE_ENV === 'production') {
          this.admin.initializeApp({
            credential: this.admin.credential.applicationDefault(),
            projectId: "roda-bem-turismo"
          });
        } else {
          // Development with mock credentials
          this.admin.initializeApp({
            projectId: "roda-bem-turismo",
            credential: this.admin.credential.applicationDefault()
          });
        }
      }
      
      this.db = this.admin.firestore();
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw new Error('Firebase Admin initialization failed');
    }
  }

  private convertTimestampsToDate<T>(data: any): T {
    const converted = { ...data };
    Object.keys(converted).forEach(key => {
      if (converted[key] && typeof converted[key].toDate === 'function') {
        converted[key] = converted[key].toDate();
      }
    });
    return converted as T;
  }

  private convertDatesToTimestamp<T>(data: T): any {
    const converted = { ...data as any };
    Object.keys(converted).forEach(key => {
      if (converted[key] instanceof Date) {
        converted[key] = this.admin.firestore.Timestamp.fromDate(converted[key]);
      }
    });
    return converted;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    throw new Error('User operations not implemented for Firestore storage');
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    throw new Error('User operations not implemented for Firestore storage');
  }

  async getUsers(): Promise<User[]> {
    throw new Error('User operations not implemented for Firestore storage');
  }

  async createUser(user: InsertUser): Promise<User> {
    throw new Error('User operations not implemented for Firestore storage');
  }

  async updateUser(id: string, user: UpdateUser): Promise<User> {
    throw new Error('User operations not implemented for Firestore storage');
  }

  async deleteUser(id: string): Promise<void> {
    throw new Error('User operations not implemented for Firestore storage');
  }

  async upsertUser(uid: string, email: string): Promise<User> {
    throw new Error('User operations not implemented for Firestore storage');
  }

  // Client operations
  async getClient(id: string): Promise<Client | undefined> {
    const docRef = this.db.collection('clients').doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return this.convertTimestampsToDate<Client>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getClients(): Promise<Client[]> {
    const querySnapshot = await this.db.collection('clients').get();
    return querySnapshot.docs.map((doc: any) => 
      this.convertTimestampsToDate<Client>({ id: doc.id, ...doc.data() })
    );
  }

  async getClientsByDestination(destinationName: string): Promise<Client[]> {
    const allClients = await this.getClients();
    return allClients.filter(client => 
      client.destination === destinationName && !(client as any).is_deleted
    );
  }

  // Generate a secure approval token
  private generateApprovalToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async searchClients(searchTerm: string, includeDeleted: boolean = false): Promise<Client[]> {
    const allClients = await this.getClients();
    const term = searchTerm.toLowerCase();
    return allClients.filter(client => {
      const matchesTerm = client.full_name_search?.includes(term);
      if (includeDeleted) return matchesTerm;
      return matchesTerm && !(client as any).is_deleted;
    });
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const now = new Date();
    const approvalExpiresAt = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // 72 hours from now
    const approvalToken = this.generateApprovalToken(); // Generate once and reuse
    
    const clientData = {
      ...this.convertDatesToTimestamp(insertClient),
      full_name_search: `${insertClient.first_name} ${insertClient.last_name}`.toLowerCase(),
      approval_token: approvalToken,
      approval_status: "pending",
      approval_date: undefined,
      approval_expires_at: this.admin.firestore.Timestamp.fromDate(approvalExpiresAt),
      created_at: this.admin.firestore.Timestamp.fromDate(now),
      updated_at: this.admin.firestore.Timestamp.fromDate(now),
    };

    const docRef = await this.db.collection('clients').add(clientData);
    const client: Client = {
      id: docRef.id,
      ...insertClient,
      full_name_search: `${insertClient.first_name} ${insertClient.last_name}`.toLowerCase(),
      approval_token: approvalToken, // Use the same token
      approval_status: "pending",
      approval_date: undefined,
      approval_expires_at: approvalExpiresAt,
      created_at: now,
      updated_at: now,
    };
    
    return client;
  }

  async updateClient(id: string, clientUpdate: UpdateClient): Promise<Client> {
    const now = new Date();
    const updateData = {
      ...this.convertDatesToTimestamp(clientUpdate),
      updated_at: this.admin.firestore.Timestamp.fromDate(now),
    };

    if (clientUpdate.first_name || clientUpdate.last_name) {
      const current = await this.getClient(id);
      if (current) {
        const firstName = clientUpdate.first_name || current.first_name;
        const lastName = clientUpdate.last_name || current.last_name;
        updateData.full_name_search = `${firstName} ${lastName}`.toLowerCase();
      }
    }

    const docRef = this.db.collection('clients').doc(id);
    await docRef.update(updateData);
    
    const updated = await this.getClient(id);
    if (!updated) throw new Error('Client not found after update');
    return updated;
  }

  async deleteClient(id: string): Promise<void> {
    await this.db.collection('clients').doc(id).delete();
  }

  async getClientByApprovalToken(token: string): Promise<Client | undefined> {
    const querySnapshot = await this.db.collection('clients')
      .where('approval_token', '==', token)
      .limit(1)
      .get();
    
    if (querySnapshot.empty) {
      return undefined;
    }
    
    const doc = querySnapshot.docs[0];
    return this.convertTimestampsToDate<Client>({ id: doc.id, ...doc.data() });
  }

  async approveClient(token: string): Promise<Client | undefined> {
    const client = await this.getClientByApprovalToken(token);
    if (!client) {
      return undefined;
    }

    // Check if approval has expired
    const now = new Date();
    if (client.approval_expires_at && client.approval_expires_at < now) {
      // Update status to expired
      const expiredClient = await this.updateClient(client.id, {
        approval_status: "expired"
      });
      return expiredClient;
    }

    // Check if already approved
    if (client.approval_status === "approved") {
      return client;
    }

    // Approve the client
    const approvedClient = await this.updateClient(client.id, {
      approval_status: "approved",
      approval_date: now
    });

    return approvedClient;
  }

  async regenerateApprovalLink(clientId: string): Promise<Client> {
    const client = await this.getClient(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const now = new Date();
    const approvalExpiresAt = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // 72 hours from now
    
    // Generate a new token (same logic as in MemStorage)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let newToken = '';
    for (let i = 0; i < 32; i++) {
      newToken += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const updatedClient = await this.updateClient(clientId, {
      approval_token: newToken,
      approval_status: "pending",
      approval_date: undefined,
      approval_expires_at: approvalExpiresAt,
    });

    return updatedClient;
  }

  async getReferralStatistics(): Promise<Array<{
    referrer_id: string;
    referrer_name: string;
    referral_count: number;
    total_revenue: number;
  }>> {
    try {
      const clients = await this.getClients();
      
      // Group clients by their referrer
      const referralMap = new Map<string, {
        referrer_name: string;
        referral_count: number;
        total_revenue: number;
      }>();

      for (const client of clients) {
        if (client.referred_by) {
          const existing = referralMap.get(client.referred_by);
          const revenue = typeof client.travel_price === 'number' ? client.travel_price : 0;
          
          if (existing) {
            existing.referral_count++;
            existing.total_revenue += revenue;
          } else {
            // Get referrer name
            const referrer = clients.find(c => c.id === client.referred_by);
            if (referrer) {
              referralMap.set(client.referred_by, {
                referrer_name: `${referrer.first_name} ${referrer.last_name}`,
                referral_count: 1,
                total_revenue: revenue,
              });
            }
          }
        }
      }

      // Convert map to array and sort by referral count
      return Array.from(referralMap.entries())
        .map(([referrer_id, stats]) => ({
          referrer_id,
          ...stats,
        }))
        .sort((a, b) => b.referral_count - a.referral_count);
    } catch (error) {
      console.error('Error getting referral statistics:', error);
      return [];
    }
  }

  // Destination operations
  async getDestination(id: string): Promise<Destination | undefined> {
    const docRef = this.db.collection('destinations').doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return this.convertTimestampsToDate<Destination>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getDestinations(): Promise<Destination[]> {
    const querySnapshot = await this.db.collection('destinations').orderBy('name').get();
    return querySnapshot.docs.map((doc: any) => 
      this.convertTimestampsToDate<Destination>({ id: doc.id, ...doc.data() })
    );
  }

  async getActiveDestinations(): Promise<Destination[]> {
    const querySnapshot = await this.db.collection('destinations')
      .where('is_active', '==', true)
      .orderBy('name')
      .get();
    return querySnapshot.docs.map((doc: any) => 
      this.convertTimestampsToDate<Destination>({ id: doc.id, ...doc.data() })
    );
  }

  async createDestination(insertDestination: InsertDestination): Promise<Destination> {
    const now = new Date();
    const destinationData = {
      ...this.convertDatesToTimestamp(insertDestination),
      created_at: this.admin.firestore.Timestamp.fromDate(now),
      updated_at: this.admin.firestore.Timestamp.fromDate(now),
    };

    const docRef = await this.db.collection('destinations').add(destinationData);
    const destination: Destination = {
      id: docRef.id,
      ...insertDestination,
      created_at: now,
      updated_at: now,
    };
    
    return destination;
  }

  async updateDestination(id: string, destinationUpdate: Partial<InsertDestination>): Promise<Destination> {
    const now = new Date();
    const updateData = {
      ...this.convertDatesToTimestamp(destinationUpdate),
      updated_at: this.admin.firestore.Timestamp.fromDate(now),
    };

    const docRef = this.db.collection('destinations').doc(id);
    await docRef.update(updateData);
    
    const updated = await this.getDestination(id);
    if (!updated) throw new Error('Destination not found after update');
    return updated;
  }

  async deleteDestination(id: string): Promise<void> {
    await this.db.collection('destinations').doc(id).delete();
  }

  // Child operations
  async getChild(id: string): Promise<Child | undefined> {
    const docRef = this.db.collection('children').doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return this.convertTimestampsToDate<Child>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getChildrenByClientId(clientId: string): Promise<Child[]> {
    const querySnapshot = await this.db.collection('children').where('client_id', '==', clientId).get();
    return querySnapshot.docs.map((doc: any) => 
      this.convertTimestampsToDate<Child>({ id: doc.id, ...doc.data() })
    );
  }

  async createChild(insertChild: InsertChild): Promise<Child> {
    const childData = this.convertDatesToTimestamp(insertChild);
    const docRef = await this.db.collection('children').add(childData);
    const child: Child = {
      id: docRef.id,
      ...insertChild,
    };
    
    return child;
  }

  async updateChild(id: string, childUpdate: Partial<InsertChild>): Promise<Child> {
    const updateData = this.convertDatesToTimestamp(childUpdate);
    const docRef = this.db.collection('children').doc(id);
    await docRef.update(updateData);
    
    const updated = await this.getChild(id);
    if (!updated) throw new Error('Child not found after update');
    return updated;
  }

  async deleteChild(id: string): Promise<void> {
    await this.db.collection('children').doc(id).delete();
  }

  // Monthly report operations
  async getMonthlyReport(id: string): Promise<MonthlyReport | undefined> {
    const docRef = this.db.collection('monthly_reports').doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return this.convertTimestampsToDate<MonthlyReport>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getMonthlyReports(): Promise<MonthlyReport[]> {
    const querySnapshot = await this.db.collection('monthly_reports').get();
    return querySnapshot.docs.map((doc: any) => 
      this.convertTimestampsToDate<MonthlyReport>({ id: doc.id, ...doc.data() })
    );
  }

  async createMonthlyReport(report: MonthlyReport): Promise<MonthlyReport> {
    const reportData = this.convertDatesToTimestamp(report);
    const docRef = await this.db.collection('monthly_reports').add(reportData);
    return { ...report, id: docRef.id };
  }

  // Financial transaction operations
  async getFinancialTransaction(id: string): Promise<FinancialTransaction | undefined> {
    const docRef = this.db.collection('financial_transactions').doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return this.convertTimestampsToDate<FinancialTransaction>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    const querySnapshot = await this.db.collection('financial_transactions').get();
    return querySnapshot.docs.map((doc: any) => 
      this.convertTimestampsToDate<FinancialTransaction>({ id: doc.id, ...doc.data() })
    ).sort((a: FinancialTransaction, b: FinancialTransaction) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async createFinancialTransaction(insertTransaction: InsertFinancialTransaction & { created_by_email: string; created_by_name: string }): Promise<FinancialTransaction> {
    const now = new Date();
    const transactionData = {
      ...this.convertDatesToTimestamp(insertTransaction),
      created_at: this.admin.firestore.Timestamp.fromDate(now),
      updated_at: this.admin.firestore.Timestamp.fromDate(now),
    };

    const docRef = await this.db.collection('financial_transactions').add(transactionData);
    const transaction: FinancialTransaction = {
      id: docRef.id,
      ...insertTransaction,
      created_at: now,
      updated_at: now,
    };
    
    return transaction;
  }

  async updateFinancialTransaction(id: string, transactionUpdate: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction> {
    const now = new Date();
    const updateData = {
      ...this.convertDatesToTimestamp(transactionUpdate),
      updated_at: this.admin.firestore.Timestamp.fromDate(now),
    };

    const docRef = this.db.collection('financial_transactions').doc(id);
    await docRef.update(updateData);
    
    const updated = await this.getFinancialTransaction(id);
    if (!updated) throw new Error('Financial transaction not found after update');
    return updated;
  }

  async deleteFinancialTransaction(id: string): Promise<void> {
    await this.db.collection('financial_transactions').doc(id).delete();
  }

  // Prospect operations - Firestore implementation stubs
  async getProspect(id: string): Promise<Prospect | undefined> {
    throw new Error('Prospect operations not implemented for Firestore storage');
  }

  async getProspects(): Promise<Prospect[]> {
    throw new Error('Prospect operations not implemented for Firestore storage');
  }

  async createProspect(prospect: InsertProspect): Promise<Prospect> {
    throw new Error('Prospect operations not implemented for Firestore storage');
  }

  async updateProspect(id: string, prospect: UpdateProspect): Promise<Prospect> {
    throw new Error('Prospect operations not implemented for Firestore storage');
  }

  async deleteProspect(id: string): Promise<void> {
    throw new Error('Prospect operations not implemented for Firestore storage');
  }

  async searchProspects(searchTerm: string): Promise<Prospect[]> {
    throw new Error('Prospect operations not implemented for Firestore storage');
  }

  async getProspectByQuoteToken(token: string): Promise<Prospect | undefined> {
    throw new Error('Prospect operations not implemented for Firestore storage');
  }

  async updateQuoteStatus(token: string, status: 'viewed' | 'accepted' | 'rejected'): Promise<Prospect | undefined> {
    throw new Error('Prospect operations not implemented for Firestore storage');
  }

  async convertProspectToClient(prospectId: string): Promise<{ prospect: Prospect; client: Client }> {
    throw new Error('Prospect operations not implemented for Firestore storage');
  }

  // Activity tracking operations (stubs)
  async getActivities(filters?: { userEmail?: string; fromMs?: number; toMs?: number; limit?: number; clientName?: string }): Promise<any[]> {
    throw new Error('Activity operations not implemented for Firestore storage');
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    throw new Error('Activity operations not implemented for Firestore storage');
  }

  async getTopCreators(filters?: { fromMs?: number; toMs?: number; limit?: number }): Promise<{ user_email: string; count: number; user_id: string }[]> {
    throw new Error('Activity operations not implemented for Firestore storage');
  }

  // Bus operations (stubs)
  async getBus(id: string): Promise<Bus | undefined> {
    throw new Error('Bus operations not implemented for Firestore storage');
  }

  async getBuses(): Promise<Bus[]> {
    throw new Error('Bus operations not implemented for Firestore storage');
  }

  async getActiveBuses(): Promise<Bus[]> {
    throw new Error('Bus operations not implemented for Firestore storage');
  }

  async createBus(bus: InsertBus): Promise<Bus> {
    throw new Error('Bus operations not implemented for Firestore storage');
  }

  async updateBus(id: string, bus: Partial<InsertBus>): Promise<Bus> {
    throw new Error('Bus operations not implemented for Firestore storage');
  }

  async deleteBus(id: string): Promise<void> {
    throw new Error('Bus operations not implemented for Firestore storage');
  }

  // Seat reservation operations (stubs)
  async getSeatReservation(id: string): Promise<SeatReservation | undefined> {
    throw new Error('Seat reservation operations not implemented for Firestore storage');
  }

  async getSeatReservations(): Promise<SeatReservation[]> {
    throw new Error('Seat reservation operations not implemented for Firestore storage');
  }

  async getSeatReservationsByDestination(destinationId: string): Promise<SeatReservation[]> {
    throw new Error('Seat reservation operations not implemented for Firestore storage');
  }

  async getSeatReservationsWithClientsByDestination(destinationId: string): Promise<Array<SeatReservation & { client?: Client }>> {
    throw new Error('Seat reservation operations not implemented for Firestore storage');
  }

  // Note: Firestore storage doesn't support seat reservation operations (they throw errors),
  // so this implementation only uses client.seat_number field. For full seat reservation support,
  // use RTDBStorage which implements the complete two-pass logic.
  async getAllPassengersByDestination(destinationName: string): Promise<Array<{ client_id: string; client_name: string; seat_number: string | null; client?: Client; is_child: boolean; child_id?: string; child_data?: Child; is_deleted?: boolean }>> {
    try {
      const clients = await this.getClients();
      const destinationClients = clients.filter(c => c.destination === destinationName);
      
      const passengers: Array<{ client_id: string; client_name: string; seat_number: string | null; client?: Client; is_child: boolean; child_id?: string; is_deleted?: boolean }> = [];
      
      for (const client of destinationClients) {
        const isDeleted = !!(client as any).is_deleted;
        // Include client if not deleted OR has a seat_number (indicating they had a reservation)
        if (!isDeleted || client.seat_number) {
          passengers.push({
            client_id: client.id,
            client_name: `${client.first_name} ${client.last_name}`,
            seat_number: client.seat_number || null,
            client: client,
            is_child: false,
            is_deleted: isDeleted,
          });
        }
        
        if (!isDeleted) {
          const children = await this.getChildrenByClientId(client.id);
          for (const child of children) {
            passengers.push({
              client_id: client.id,
              client_name: child.name,
              seat_number: child.seat_number || null,
              client: client,
              is_child: true,
              child_id: child.id,
              is_deleted: false,
            });
          }
        }
      }
      
      return passengers;
    } catch (error) {
      console.error('Error getting all passengers by destination:', error);
      return [];
    }
  }

  async getSeatReservationsByBus(busId: string): Promise<SeatReservation[]> {
    throw new Error('Seat reservation operations not implemented for Firestore storage');
  }

  async createSeatReservation(reservation: InsertSeatReservation): Promise<SeatReservation> {
    throw new Error('Seat reservation operations not implemented for Firestore storage');
  }

  async updateSeatReservation(id: string, reservation: Partial<InsertSeatReservation>): Promise<SeatReservation> {
    throw new Error('Seat reservation operations not implemented for Firestore storage');
  }

  async deleteSeatReservation(id: string): Promise<void> {
    throw new Error('Seat reservation operations not implemented for Firestore storage');
  }

  async getSeatReservationByDestinationAndSeat(destinationId: string, seatNumber: string): Promise<SeatReservation | undefined> {
    throw new Error('Seat reservation operations not implemented for Firestore storage');
  }

  // Receipt operations (stubs)
  async getReceipt(id: string): Promise<Receipt | undefined> {
    throw new Error('Receipt operations not implemented for Firestore storage');
  }

  async getReceipts(): Promise<Receipt[]> {
    throw new Error('Receipt operations not implemented for Firestore storage');
  }

  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    throw new Error('Receipt operations not implemented for Firestore storage');
  }

  async updateReceipt(id: string, receipt: Partial<InsertReceipt>): Promise<Receipt> {
    throw new Error('Receipt operations not implemented for Firestore storage');
  }

  async deleteReceipt(id: string): Promise<void> {
    throw new Error('Receipt operations not implemented for Firestore storage');
  }

  // Parcela operations (stubs)
  async getParcela(id: string): Promise<Parcela | undefined> {
    throw new Error('Parcela operations not implemented for Firestore storage');
  }

  async getParcelas(): Promise<Parcela[]> {
    throw new Error('Parcela operations not implemented for Firestore storage');
  }

  async getParcelasByClientId(clientId: string): Promise<Parcela[]> {
    throw new Error('Parcela operations not implemented for Firestore storage');
  }

  async getParcelasByMonth(month: number, year: number): Promise<Parcela[]> {
    throw new Error('Parcela operations not implemented for Firestore storage');
  }

  async createParcela(parcela: InsertParcela): Promise<Parcela> {
    throw new Error('Parcela operations not implemented for Firestore storage');
  }

  async updateParcela(id: string, parcela: Partial<InsertParcela>): Promise<Parcela> {
    throw new Error('Parcela operations not implemented for Firestore storage');
  }

  async deleteParcela(id: string): Promise<void> {
    throw new Error('Parcela operations not implemented for Firestore storage');
  }

  async deleteParcelasByClientId(clientId: string): Promise<void> {
    throw new Error('Parcela operations not implemented for Firestore storage');
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    throw new Error('Department operations not implemented for Firestore storage');
  }

  async getDepartments(): Promise<Department[]> {
    throw new Error('Department operations not implemented for Firestore storage');
  }

  async getActiveDepartments(): Promise<Department[]> {
    throw new Error('Department operations not implemented for Firestore storage');
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    throw new Error('Department operations not implemented for Firestore storage');
  }

  async updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department> {
    throw new Error('Department operations not implemented for Firestore storage');
  }

  async deleteDepartment(id: string): Promise<void> {
    throw new Error('Department operations not implemented for Firestore storage');
  }

  // Time record operations (stubs)
  async getTimeRecord(id: string): Promise<TimeRecord | undefined> {
    throw new Error('Time record operations not implemented for Firestore storage');
  }

  async getTimeRecords(): Promise<TimeRecord[]> {
    throw new Error('Time record operations not implemented for Firestore storage');
  }

  async getTimeRecordsByUserId(userId: string): Promise<TimeRecord[]> {
    throw new Error('Time record operations not implemented for Firestore storage');
  }

  async getTimeRecordsByDateRange(startDate: string, endDate: string): Promise<TimeRecord[]> {
    throw new Error('Time record operations not implemented for Firestore storage');
  }

  async getTodayTimeRecord(userId: string): Promise<TimeRecord | undefined> {
    throw new Error('Time record operations not implemented for Firestore storage');
  }

  async createTimeRecord(timeRecord: InsertTimeRecord): Promise<TimeRecord> {
    throw new Error('Time record operations not implemented for Firestore storage');
  }

  async updateTimeRecord(id: string, timeRecord: Partial<InsertTimeRecord>): Promise<TimeRecord> {
    throw new Error('Time record operations not implemented for Firestore storage');
  }

  async deleteTimeRecord(id: string): Promise<void> {
    throw new Error('Time record operations not implemented for Firestore storage');
  }

  // Facial verification session operations
  async getFacialVerificationSession(id: string): Promise<FacialVerificationSession | undefined> {
    throw new Error('Facial verification session operations not implemented for Firestore storage');
  }

  async getFacialVerificationSessionByToken(token: string): Promise<FacialVerificationSession | undefined> {
    throw new Error('Facial verification session operations not implemented for Firestore storage');
  }

  async createFacialVerificationSession(session: InsertFacialVerificationSession): Promise<FacialVerificationSession> {
    throw new Error('Facial verification session operations not implemented for Firestore storage');
  }

  async updateFacialVerificationSession(id: string, session: Partial<InsertFacialVerificationSession>): Promise<FacialVerificationSession> {
    throw new Error('Facial verification session operations not implemented for Firestore storage');
  }

  async deleteFacialVerificationSession(id: string): Promise<void> {
    throw new Error('Facial verification session operations not implemented for Firestore storage');
  }

  async cleanupExpiredSessions(): Promise<void> {
    throw new Error('Facial verification session operations not implemented for Firestore storage');
  }

  async getDiscountApprovalRequest(id: string): Promise<DiscountApprovalRequest | undefined> {
    throw new Error('Discount approval operations not implemented for Firestore storage');
  }

  async getDiscountApprovalRequests(): Promise<DiscountApprovalRequest[]> {
    throw new Error('Discount approval operations not implemented for Firestore storage');
  }

  async getPendingDiscountApprovalRequests(): Promise<DiscountApprovalRequest[]> {
    throw new Error('Discount approval operations not implemented for Firestore storage');
  }

  async createDiscountApprovalRequest(request: InsertDiscountApprovalRequest): Promise<DiscountApprovalRequest> {
    throw new Error('Discount approval operations not implemented for Firestore storage');
  }

  async approveDiscountRequest(id: string, vadminId: string, vadminName: string, maxDiscountPercentage: number): Promise<DiscountApprovalRequest> {
    throw new Error('Discount approval operations not implemented for Firestore storage');
  }

  async rejectDiscountRequest(id: string, vadminId: string, vadminName: string, reason?: string): Promise<DiscountApprovalRequest> {
    throw new Error('Discount approval operations not implemented for Firestore storage');
  }

  async deleteDiscountApprovalRequest(id: string): Promise<void> {
    throw new Error('Discount approval operations not implemented for Firestore storage');
  }

  async getInvitationLink(linkToken: string): Promise<InvitationLink | undefined> {
    return undefined;
  }

  async createInvitationLink(link: InsertInvitationLink): Promise<InvitationLink> {
    throw new Error('Invitation link operations not implemented for Firestore storage');
  }

  async updateInvitationLinkUsage(linkToken: string): Promise<InvitationLink | undefined> {
    return undefined;
  }
}

// Initialize storage with fallback
let storage: IStorage;

try {
  console.log('Initializing Firebase Realtime Database storage...');
  storage = new RTDBStorage();
} catch (error) {
  console.warn('Firebase RTDB initialization failed, falling back to in-memory storage:', error);
  // Fallback to a simple implementation if RTDB fails
  const fallbackUsers = new Map<string, User>();
  const fallbackInvitationLinks = new Map<string, InvitationLink>();
  
  const fallbackStorage: IStorage = {
    // User operations
    async getUser(id: string): Promise<User | undefined> {
      return fallbackUsers.get(id);
    },
    async getUserByEmail(email: string): Promise<User | undefined> {
      const users = Array.from(fallbackUsers.values());
      return users.find(user => user.email === email.toLowerCase());
    },
    async getUsers(): Promise<User[]> {
      return Array.from(fallbackUsers.values());
    },
    async createUser(user: InsertUser): Promise<User> {
      const now = new Date();
      return {
        id: `fallback_${Date.now()}`,
        ...user,
        created_at: now,
        updated_at: now,
      };
    },
    async updateUser(id: string, user: UpdateUser): Promise<User> {
      throw new Error('User not found');
    },
    async deleteUser(id: string): Promise<void> {},

    async upsertUser(uid: string, email: string): Promise<User> {
      if (!email) {
        throw new Error('Email is required');
      }
      
      const normalizedEmail = email.toLowerCase();
      const vadminEmails = ['alda@rodabemturismo.com', 'daniel@rodabemturismo.com', 'rosinha@rodabemturismo.com'];
      const role = vadminEmails.includes(normalizedEmail) ? 'vadmin' : 'admin';
      const now = new Date();
      
      const user: User = {
        id: uid,
        email: normalizedEmail,
        role: role as 'admin' | 'vadmin',
        created_at: now,
        updated_at: now,
      };
      
      // Store user in memory for persistence during development
      fallbackUsers.set(uid, user);
      
      console.log(`✅ Created/updated user: ${email} with role: ${role}`);
      return user;
    },

    // Client operations
    async getClient(id: string): Promise<Client | undefined> {
      return undefined;
    },
    async getClients(): Promise<Client[]> {
      return [];
    },
    async getClientsByDestination(destinationName: string): Promise<Client[]> {
      return [];
    },
    async createClient(client: InsertClient): Promise<Client> {
      const now = new Date();
      const approvalExpiresAt = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // 72 hours from now
      
      // Simple token generator for fallback
      const generateToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
      
      return {
        id: `fallback_${Date.now()}`,
        ...client,
        full_name_search: `${client.first_name} ${client.last_name}`.toLowerCase(),
        approval_token: generateToken(),
        approval_status: "pending",
        approval_date: undefined,
        approval_expires_at: approvalExpiresAt,
        created_at: now,
        updated_at: now,
      };
    },
    async updateClient(id: string, client: UpdateClient): Promise<Client> {
      throw new Error('Client not found');
    },
    async deleteClient(id: string): Promise<void> {},
    async searchClients(searchTerm: string, includeDeleted?: boolean): Promise<Client[]> {
      return [];
    },
    // Client approval operations
    async getClientByApprovalToken(token: string): Promise<Client | undefined> {
      return undefined;
    },
    async approveClient(token: string): Promise<Client | undefined> {
      return undefined;
    },
    async regenerateApprovalLink(clientId: string): Promise<Client> {
      throw new Error('Client not found in fallback storage');
    },
    async getReferralStatistics(): Promise<Array<{
      referrer_id: string;
      referrer_name: string;
      referral_count: number;
      total_revenue: number;
    }>> {
      return [];
    },
    // Destination operations
    async getDestination(id: string): Promise<Destination | undefined> {
      return undefined;
    },
    async getDestinations(): Promise<Destination[]> {
      return [];
    },
    async getActiveDestinations(): Promise<Destination[]> {
      return [];
    },
    async createDestination(destination: InsertDestination): Promise<Destination> {
      const now = new Date();
      return {
        id: `fallback_${Date.now()}`,
        ...destination,
        created_at: now,
        updated_at: now,
      };
    },
    async updateDestination(id: string, destination: Partial<InsertDestination>): Promise<Destination> {
      throw new Error('Destination not found');
    },
    async deleteDestination(id: string): Promise<void> {},
    // Child operations
    async getChild(id: string): Promise<Child | undefined> {
      return undefined;
    },
    async getChildrenByClientId(clientId: string): Promise<Child[]> {
      return [];
    },
    async createChild(child: InsertChild): Promise<Child> {
      return { id: `fallback_${Date.now()}`, ...child };
    },
    async updateChild(id: string, child: Partial<InsertChild>): Promise<Child> {
      throw new Error('Child not found');
    },
    async deleteChild(id: string): Promise<void> {},
    // Monthly report operations
    async getMonthlyReport(id: string): Promise<MonthlyReport | undefined> {
      return undefined;
    },
    async getMonthlyReports(): Promise<MonthlyReport[]> {
      return [];
    },
    async createMonthlyReport(report: MonthlyReport): Promise<MonthlyReport> {
      return { ...report, id: `fallback_${Date.now()}` };
    },
    // Financial transaction operations
    async getFinancialTransaction(id: string): Promise<FinancialTransaction | undefined> {
      return undefined;
    },
    async getFinancialTransactions(): Promise<FinancialTransaction[]> {
      return [];
    },
    async createFinancialTransaction(transaction: InsertFinancialTransaction & { created_by_email: string; created_by_name: string }): Promise<FinancialTransaction> {
      const now = new Date();
      return {
        id: `fallback_${Date.now()}`,
        ...transaction,
        created_at: now,
        updated_at: now,
      };
    },
    async updateFinancialTransaction(id: string, transaction: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction> {
      throw new Error('Financial transaction not found');
    },
    async deleteFinancialTransaction(id: string): Promise<void> {},
    // Prospect operations - fallback stubs
    async getProspect(id: string): Promise<Prospect | undefined> {
      return undefined;
    },
    async getProspects(): Promise<Prospect[]> {
      return [];
    },
    async createProspect(prospect: InsertProspect): Promise<Prospect> {
      const now = new Date();
      const token = Math.random().toString(36).substr(2, 32);
      return {
        id: `fallback_${Date.now()}`,
        ...prospect,
        full_name_search: `${prospect.first_name} ${prospect.last_name}`.toLowerCase(),
        quote_token: token,
        quote_link: `http://localhost:5000/quote/${token}`,
        quote_status: "pending",
        is_converted: false,
        created_at: now,
        updated_at: now,
      };
    },
    async updateProspect(id: string, prospect: UpdateProspect): Promise<Prospect> {
      throw new Error('Prospect not found');
    },
    async deleteProspect(id: string): Promise<void> {},
    async searchProspects(searchTerm: string): Promise<Prospect[]> {
      return [];
    },
    async getProspectByQuoteToken(token: string): Promise<Prospect | undefined> {
      return undefined;
    },
    async updateQuoteStatus(token: string, status: 'viewed' | 'accepted' | 'rejected'): Promise<Prospect | undefined> {
      return undefined;
    },
    async convertProspectToClient(prospectId: string): Promise<{ prospect: Prospect; client: Client }> {
      throw new Error('Prospect conversion not supported in fallback storage');
    },

    // Activity tracking operations (fallback stubs)
    async getActivities(filters?: { userEmail?: string; fromMs?: number; toMs?: number; limit?: number; clientName?: string }): Promise<any[]> {
      return [];
    },

    async createActivity(activity: InsertActivity): Promise<Activity> {
      const now = new Date();
      return {
        id: `fallback_${Date.now()}`,
        ...activity,
        created_at: now,
        created_at_ms: now.getTime(),
      };
    },

    async getTopCreators(filters?: { fromMs?: number; toMs?: number; limit?: number }): Promise<{ user_email: string; count: number; user_id: string }[]> {
      return [];
    },

    // Bus operations (fallback stubs)
    async getBus(id: string): Promise<Bus | undefined> {
      return undefined;
    },
    async getBuses(): Promise<Bus[]> {
      return [];
    },
    async getActiveBuses(): Promise<Bus[]> {
      return [];
    },
    async createBus(bus: InsertBus): Promise<Bus> {
      const now = new Date();
      return {
        id: `fallback_${Date.now()}`,
        ...bus,
        created_at: now,
        updated_at: now,
      };
    },
    async updateBus(id: string, bus: Partial<InsertBus>): Promise<Bus> {
      throw new Error('Bus not found');
    },
    async deleteBus(id: string): Promise<void> {},

    // Seat reservation operations (fallback stubs)
    async getSeatReservation(id: string): Promise<SeatReservation | undefined> {
      return undefined;
    },
    async getSeatReservations(): Promise<SeatReservation[]> {
      return [];
    },
    async getSeatReservationsByDestination(destinationId: string): Promise<SeatReservation[]> {
      return [];
    },
    async getSeatReservationsWithClientsByDestination(destinationId: string): Promise<Array<SeatReservation & { client?: Client }>> {
      return [];
    },
    async getAllPassengersByDestination(destinationName: string): Promise<Array<{ client_id: string; client_name: string; seat_number: string | null; client?: Client; is_child: boolean; child_id?: string; child_data?: Child; is_deleted?: boolean }>> {
      return [];
    },
    async getSeatReservationsByBus(busId: string): Promise<SeatReservation[]> {
      return [];
    },
    async createSeatReservation(reservation: InsertSeatReservation): Promise<SeatReservation> {
      const now = new Date();
      return {
        id: `fallback_${Date.now()}`,
        ...reservation,
        created_at: now,
        updated_at: now,
      };
    },
    async updateSeatReservation(id: string, reservation: Partial<InsertSeatReservation>): Promise<SeatReservation> {
      throw new Error('Seat reservation not found');
    },
    async deleteSeatReservation(id: string): Promise<void> {},
    async getSeatReservationByDestinationAndSeat(destinationId: string, seatNumber: string): Promise<SeatReservation | undefined> {
      return undefined;
    },

    // Receipt operations (fallback stubs)
    async getReceipt(id: string): Promise<Receipt | undefined> {
      return undefined;
    },
    async getReceipts(): Promise<Receipt[]> {
      return [];
    },
    async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
      const now = new Date();
      return {
        id: `fallback_${Date.now()}`,
        ...receipt,
        created_at: now,
        updated_at: now,
      };
    },
    async updateReceipt(id: string, receipt: Partial<InsertReceipt>): Promise<Receipt> {
      throw new Error('Receipt not found');
    },
    async deleteReceipt(id: string): Promise<void> {},

    // Parcela operations (fallback stubs)
    async getParcela(id: string): Promise<Parcela | undefined> {
      return undefined;
    },
    async getParcelas(): Promise<Parcela[]> {
      return [];
    },
    async getParcelasByClientId(clientId: string): Promise<Parcela[]> {
      return [];
    },
    async getParcelasByMonth(month: number, year: number): Promise<Parcela[]> {
      return [];
    },
    async createParcela(parcela: InsertParcela): Promise<Parcela> {
      const now = new Date();
      return {
        id: `fallback_${Date.now()}`,
        ...parcela,
        created_at: now,
        updated_at: now,
      };
    },
    async updateParcela(id: string, parcela: Partial<InsertParcela>): Promise<Parcela> {
      throw new Error('Parcela not found');
    },
    async deleteParcela(id: string): Promise<void> {},
    async deleteParcelasByClientId(clientId: string): Promise<void> {},
    
    async getDepartment(id: string): Promise<Department | undefined> {
      return undefined;
    },
    async getDepartments(): Promise<Department[]> {
      return [];
    },
    async getActiveDepartments(): Promise<Department[]> {
      return [];
    },
    async createDepartment(department: InsertDepartment): Promise<Department> {
      const now = new Date();
      return {
        id: Date.now().toString(),
        ...department,
        created_at: now,
        updated_at: now,
      };
    },
    async updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department> {
      const now = new Date();
      return {
        id,
        name: department.name || '',
        description: department.description || '',
        responsible: department.responsible,
        subsectors: department.subsectors,
        order: department.order || 0,
        is_active: department.is_active !== undefined ? department.is_active : true,
        created_at: now,
        updated_at: now,
      };
    },
    async deleteDepartment(id: string): Promise<void> {},

    // Time record operations
    async getTimeRecord(id: string): Promise<TimeRecord | undefined> {
      return undefined;
    },
    async getTimeRecords(): Promise<TimeRecord[]> {
      return [];
    },
    async getTimeRecordsByUserId(userId: string): Promise<TimeRecord[]> {
      return [];
    },
    async getTimeRecordsByDateRange(startDate: string, endDate: string): Promise<TimeRecord[]> {
      return [];
    },
    async getTodayTimeRecord(userId: string): Promise<TimeRecord | undefined> {
      return undefined;
    },
    async createTimeRecord(timeRecord: InsertTimeRecord): Promise<TimeRecord> {
      const now = new Date();
      return {
        id: Math.random().toString(36).substr(2, 9),
        ...timeRecord,
        created_at: now,
        updated_at: now,
      };
    },
    async updateTimeRecord(id: string, timeRecord: Partial<InsertTimeRecord>): Promise<TimeRecord> {
      throw new Error('Not implemented');
    },
    async deleteTimeRecord(id: string): Promise<void> {},

    // Facial verification session operations
    async getFacialVerificationSession(id: string): Promise<FacialVerificationSession | undefined> {
      return undefined;
    },
    async getFacialVerificationSessionByToken(token: string): Promise<FacialVerificationSession | undefined> {
      return undefined;
    },
    async createFacialVerificationSession(session: InsertFacialVerificationSession): Promise<FacialVerificationSession> {
      const now = new Date();
      return {
        id: Math.random().toString(36).substr(2, 9),
        ...session,
        created_at: now,
        updated_at: now,
      };
    },
    async updateFacialVerificationSession(id: string, session: Partial<InsertFacialVerificationSession>): Promise<FacialVerificationSession> {
      throw new Error('Not implemented');
    },
    async deleteFacialVerificationSession(id: string): Promise<void> {},
    async cleanupExpiredSessions(): Promise<void> {},

    // Discount approval request operations
    async getDiscountApprovalRequest(id: string): Promise<DiscountApprovalRequest | undefined> {
      return undefined;
    },
    async getDiscountApprovalRequests(): Promise<DiscountApprovalRequest[]> {
      return [];
    },
    async getPendingDiscountApprovalRequests(): Promise<DiscountApprovalRequest[]> {
      return [];
    },
    async createDiscountApprovalRequest(request: InsertDiscountApprovalRequest): Promise<DiscountApprovalRequest> {
      const now = new Date();
      return {
        id: Math.random().toString(36).substr(2, 9),
        ...request,
        status: 'pending',
        created_at: now,
        updated_at: now,
      };
    },
    async approveDiscountRequest(id: string, vadminId: string, vadminName: string, maxDiscountPercentage: number): Promise<DiscountApprovalRequest> {
      const now = new Date();
      return {
        id,
        client_id: '',
        client_name: '',
        client_destination: '',
        amount_client_will_pay: 0,
        requested_discount_percentage: 0,
        admin_id: '',
        admin_email: '',
        admin_name: '',
        status: 'approved',
        approved_by_vadmin_id: vadminId,
        approved_by_vadmin_name: vadminName,
        max_discount_percentage_allowed: maxDiscountPercentage,
        approved_at: now,
        created_at: now,
        updated_at: now,
      };
    },
    async rejectDiscountRequest(id: string, vadminId: string, vadminName: string, reason?: string): Promise<DiscountApprovalRequest> {
      const now = new Date();
      return {
        id,
        client_id: '',
        client_name: '',
        client_destination: '',
        amount_client_will_pay: 0,
        requested_discount_percentage: 0,
        admin_id: '',
        admin_email: '',
        admin_name: '',
        status: 'rejected',
        approved_by_vadmin_id: vadminId,
        approved_by_vadmin_name: vadminName,
        rejection_reason: reason,
        created_at: now,
        updated_at: now,
      };
    },
    async deleteDiscountApprovalRequest(id: string): Promise<void> {},
    
    // Invitation link operations (fallback)
    async getInvitationLink(linkToken: string): Promise<InvitationLink | undefined> {
      return fallbackInvitationLinks.get(linkToken);
    },
    async createInvitationLink(link: InsertInvitationLink): Promise<InvitationLink> {
      const now = new Date();
      const linkToken = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const invitationLink: InvitationLink = {
        id: `fallback_${Date.now()}`,
        link_token: linkToken,
        ...link,
        created_at: now,
        used_count: 0,
      };
      fallbackInvitationLinks.set(linkToken, invitationLink);
      return invitationLink;
    },
    async updateInvitationLinkUsage(linkToken: string): Promise<InvitationLink | undefined> {
      const link = fallbackInvitationLinks.get(linkToken);
      if (!link) return undefined;
      const updated = {
        ...link,
        used_count: (link.used_count || 0) + 1,
        last_used_at: new Date(),
      };
      fallbackInvitationLinks.set(linkToken, updated);
      return updated;
    },

    // CRM Task operations (fallback)
    async getCrmTask(id: string): Promise<CrmTask | undefined> {
      return this.crmTasks.get(id);
    },
    async getCrmTasks(): Promise<CrmTask[]> {
      return Array.from(this.crmTasks.values());
    },
    async getCrmTasksByUserId(userId: string): Promise<CrmTask[]> {
      return Array.from(this.crmTasks.values()).filter(task => task.assigned_to_user_id === userId);
    },
    async getCrmTasksCreatedBy(userId: string): Promise<CrmTask[]> {
      return Array.from(this.crmTasks.values()).filter(task => task.assigned_by_user_id === userId);
    },
    async createCrmTask(insertTask: InsertCrmTask): Promise<CrmTask> {
      const now = new Date();
      const checklist = insertTask.checklist || [];
      const completedItems = checklist.filter(item => item.done).length;
      const totalItems = checklist.length;
      const completion_percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      
      const task: CrmTask = {
        id: this.generateId(),
        ...insertTask,
        status: 'pending',
        completion_percentage,
        created_at: now,
        updated_at: now,
      };
      this.crmTasks.set(task.id, task);
      return task;
    },
    async updateCrmTask(id: string, updates: Partial<InsertCrmTask> & { status?: 'pending' | 'in_progress' | 'completed'; completed_at?: Date | null; completion_percentage?: number }): Promise<CrmTask> {
      const task = this.crmTasks.get(id);
      if (!task) throw new Error('Task not found');
      const now = new Date();
      
      const checklist = updates.checklist !== undefined ? updates.checklist : task.checklist || [];
      const completedItems = checklist.filter(item => item.done).length;
      const totalItems = checklist.length;
      const autoPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : (updates.completion_percentage ?? task.completion_percentage ?? 0);
      
      const updated: CrmTask = {
        ...task,
        ...updates,
        completion_percentage: updates.checklist !== undefined ? autoPercentage : (updates.completion_percentage ?? task.completion_percentage ?? 0),
        updated_at: now,
      };
      this.crmTasks.set(id, updated);
      return updated;
    },
    async deleteCrmTask(id: string): Promise<void> {
      this.crmTasks.delete(id);
    },
    async getNotifications(userEmail: string, unreadOnly?: boolean): Promise<any[]> {
      const allNotifications = Array.from(this.notifications.values());
      let filtered = allNotifications.filter(n => n.user_email === userEmail);
      if (unreadOnly) {
        filtered = filtered.filter(n => !n.read);
      }
      return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    async createNotification(insertNotification: any): Promise<any> {
      const now = new Date();
      const notification = {
        id: this.generateId(),
        ...insertNotification,
        read: false,
        created_at: now,
        updated_at: now,
      };
      this.notifications.set(notification.id, notification);
      return notification;
    },
    async markNotificationAsRead(notificationId: string): Promise<any> {
      const notification = this.notifications.get(notificationId);
      if (!notification) throw new Error('Notification not found');
      const updated = { ...notification, read: true, updated_at: new Date() };
      this.notifications.set(notificationId, updated);
      return updated;
    },
    async getBill(id: string): Promise<any> {
      return this.bills.get(id);
    },
    async getBills(type?: string): Promise<any[]> {
      const allBills = Array.from(this.bills.values());
      const now = new Date();
      let bills = allBills.map(b => {
        if (b.status !== "paid" && new Date(b.due_date) < now) {
          return { ...b, status: "overdue" };
        }
        return b;
      });
      if (type) bills = bills.filter(b => b.type === type);
      return bills.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
    },
    async getBillsByStatus(status: string): Promise<any[]> {
      const bills = await this.getBills();
      return bills.filter(b => b.status === status);
    },
    async createBill(insertBill: any): Promise<any> {
      const now = new Date();
      const bill = {
        id: this.generateId(),
        ...insertBill,
        status: "pending",
        created_at: now,
        updated_at: now,
      };
      this.bills.set(bill.id, bill);
      return bill;
    },
    async updateBill(id: string, updates: any): Promise<any> {
      const bill = this.bills.get(id);
      if (!bill) throw new Error('Bill not found');
      const updated = { ...bill, ...updates, updated_at: new Date() };
      this.bills.set(id, updated);
      return updated;
    },
    async deleteBill(id: string): Promise<void> {
      this.bills.delete(id);
    },
    async checkAndCreateBillReminders(): Promise<void> {
      // Fallback storage - no persistence needed for reminders
    },
  };
  storage = fallbackStorage;
}

export { storage };

