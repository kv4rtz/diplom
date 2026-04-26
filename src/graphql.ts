
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum AchievementType {
    MEMORABLE = "MEMORABLE",
    MILESTONES = "MILESTONES",
    EPIC = "EPIC",
    SPECIAL = "SPECIAL"
}

export enum OAuthProvider {
    vk = "vk",
    discord = "discord"
}

export enum ChatMemberRoles {
    admin = "admin",
    member = "member"
}

export enum ComissionType {
    REPLENISHMENT = "REPLENISHMENT",
    WITHDRAWAL = "WITHDRAWAL"
}

export enum SuggestedGameCategoryStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export enum GameOptionType {
    tab = "tab",
    select = "select",
    range = "range"
}

export enum GameType {
    game = "game",
    mobile_game = "mobile_game",
    application = "application"
}

export enum GlobalCategoryType {
    products = "products",
    services = "services"
}

export enum Locale {
    ru = "ru",
    en = "en",
    de = "de"
}

export enum Currency {
    RUB = "RUB",
    USD = "USD",
    EUR = "EUR"
}

export enum OrderDirection {
    ASC = "ASC",
    DESC = "DESC"
}

export enum MessageType {
    TEXT = "TEXT",
    AUTOREPLY = "AUTOREPLY",
    ORDER_PAID = "ORDER_PAID",
    ORDER_CONFIRMED_ADMIN = "ORDER_CONFIRMED_ADMIN",
    ORDER_REOPENED = "ORDER_REOPENED",
    VOICE_INVITE = "VOICE_INVITE",
    VOICE_ENTER = "VOICE_ENTER",
    VOICE_SELLER_JOINED = "VOICE_SELLER_JOINED",
    VOICE_FINISHED = "VOICE_FINISHED",
    REFUND_CHECK = "REFUND_CHECK",
    ORDER_CONFIRMED_BUYER = "ORDER_CONFIRMED_BUYER",
    REVIEW_CREATED = "REVIEW_CREATED",
    REVIEW_DELETED = "REVIEW_DELETED",
    REVIEW_REPLY_ADDED = "REVIEW_REPLY_ADDED",
    REVIEW_REPLY_DELETED = "REVIEW_REPLY_DELETED",
    REFUND_APPROVED = "REFUND_APPROVED",
    REFUND_DELAYED = "REFUND_DELAYED",
    SYSTEM_TICKET_NEW_ANSWER = "SYSTEM_TICKET_NEW_ANSWER",
    SYSTEM_TICKET_IS_RESOLVED = "SYSTEM_TICKET_IS_RESOLVED"
}

export enum OrderStatus {
    PENDING = "PENDING",
    REFUNDED = "REFUNDED",
    COMPLETED = "COMPLETED",
    REOPENED = "REOPENED"
}

export enum ComplaintProductStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export enum ComplaintProductReasons {
    POOR_QUALITY_PRODUCT = "POOR_QUALITY_PRODUCT",
    ADVERTISEMENT = "ADVERTISEMENT",
    OFFENSIVE_CONTENT = "OFFENSIVE_CONTENT",
    DUPLICATE_PRODUCTS = "DUPLICATE_PRODUCTS",
    INVALID_DESCRIPTION = "INVALID_DESCRIPTION",
    MISLEADING_INFORMATION = "MISLEADING_INFORMATION",
    OTHER = "OTHER"
}

export enum ReviewType {
    TO_SELLER = "TO_SELLER",
    TO_PLATFORM = "TO_PLATFORM",
    TO_REVIEWER = "TO_REVIEWER"
}

export enum TicketStatus {
    WAITING = "WAITING",
    OPEN = "OPEN",
    RESOLVED = "RESOLVED"
}

export enum TicketTopic {
    PROBLEM_WITH_ORDER = "PROBLEM_WITH_ORDER",
    OTHER = "OTHER"
}

export enum TicketTopicCategory {
    DONT_GIVE_PRODUCT = "DONT_GIVE_PRODUCT"
}

export enum TransactionType {
    REPLENISHMENT = "REPLENISHMENT",
    WITHDRAWAL = "WITHDRAWAL",
    DEDUCTION = "DEDUCTION",
    REFUND = "REFUND"
}

export enum WithdrawalRublesMethods {
    bank_card = "bank_card",
    sbp = "sbp",
    yoo_money = "yoo_money"
}

export enum UserTradingOption {
    SHOW_ALL_MY_PRODUCTS = "SHOW_ALL_MY_PRODUCTS",
    HIDE_MY_PRODUCTS_IN_FEED = "HIDE_MY_PRODUCTS_IN_FEED",
    HIDE_MY_PRODUCTS_EVERYWHERE = "HIDE_MY_PRODUCTS_EVERYWHERE"
}

export enum UserCodeType {
    CONFIRM_EMAIL = "CONFIRM_EMAIL",
    RESET_PASS = "RESET_PASS",
    CHANGE_PASS = "CHANGE_PASS"
}

export enum UserComplaintReason {
    SPAM = "SPAM",
    ADVERTISEMENT = "ADVERTISEMENT",
    OFFENSIVE_CONTENT = "OFFENSIVE_CONTENT",
    DUPLICATE_PRODUCTS = "DUPLICATE_PRODUCTS",
    INVALID_DESCRIPTION = "INVALID_DESCRIPTION",
    MISLEADING_INFORMATION = "MISLEADING_INFORMATION",
    OTHER = "OTHER"
}

export enum ComplaintUserStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export interface GameCategoryTranslationInput {
    locale: Locale;
    label: string;
}

export interface GameCategoryOptionInput {
    type: GameOptionType;
    isRequired: boolean;
    values?: Nullable<GameCategoryOptionValuesInput[]>;
    rangeMin?: Nullable<number>;
    rangeMax?: Nullable<number>;
    translations: GameCategoryOptionTranslationInput[];
}

export interface GameCategoryOptionValuesInput {
    translations: GameCategoryOptionValueInput[];
}

export interface GameCategoryOptionValueInput {
    locale: Locale;
    name: string;
}

export interface GameCategoryOptionTranslationInput {
    locale: Locale;
    name: string;
}

export interface GameTranslationInput {
    locale: Locale;
    name: string;
    description: string;
}

export interface GlobalCategoryTranslationInput {
    locale: Locale;
    name: string;
    description: string;
}

export interface PageInfo {
    page?: Nullable<NonNegativeInt>;
    limit?: Nullable<NonNegativeInt>;
}

export interface ProductOptionValueInput {
    gameCategoryOptionId: UnsignedInt;
    value: string;
}

export interface ProductTranslationInput {
    locale: Locale;
    name?: Nullable<string>;
    description?: Nullable<string>;
    messageForBuyer?: Nullable<string>;
}

export interface ProductFilterOptionInput {
    gameCategoryOptionId: UnsignedInt;
    equals?: Nullable<string>;
    min?: Nullable<number>;
    max?: Nullable<number>;
}

export interface ProductPriceFilterInput {
    min?: Nullable<number>;
    max?: Nullable<number>;
}

export interface RoleTranslationInput {
    locale: Locale;
    name: string;
}

export interface UploadInput {
    mimeType: string;
    bucket: string;
}

export interface Pagination {
    pages: number;
    count: number;
}

export interface Achievement {
    id: string;
    type: AchievementType;
    code: string;
    title: string;
    description: string;
    translations: AchievementTranslation[];
    icon: string;
    percentageOfUsers: number;
    having?: Nullable<boolean>;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface AchievementTranslation {
    locale: Locale;
    title: string;
    description: string;
}

export interface IQuery {
    achievements(type?: Nullable<AchievementType>, userId?: Nullable<number>, onlyPinned?: Nullable<boolean>): Achievement[] | Promise<Achievement[]>;
    viewer(): Nullable<User> | Promise<Nullable<User>>;
    checkAdminAccess(): Nullable<boolean> | Promise<Nullable<boolean>>;
    allNewMessageCount(): Nullable<number> | Promise<Nullable<number>>;
    myChats(pageInfo?: Nullable<PageInfo>): PaginatedChats | Promise<PaginatedChats>;
    checkExistsChatWithUser(memberId: UnsignedInt): boolean | Promise<boolean>;
    chatById(id: UnsignedInt): Chat | Promise<Chat>;
    chatByMemberId(memberId: UnsignedInt): Chat | Promise<Chat>;
    commissions(): Commission[] | Promise<Commission[]>;
    calculateCost(amount: number, type: ComissionType): CostCalculated[] | Promise<CostCalculated[]>;
    convertAmount(amount: number, from: Currency): CurrencyValue[] | Promise<CurrencyValue[]>;
    getMyFinance(): Finance | Promise<Finance>;
    gameCategories(pageInfo?: Nullable<PageInfo>, gameId?: Nullable<UnsignedInt>, order?: Nullable<string>, search?: Nullable<string>, showHidden?: Nullable<boolean>): Nullable<PaginatedGameCategories> | Promise<Nullable<PaginatedGameCategories>>;
    adminGameCategories(pageInfo?: Nullable<PageInfo>, allowScreenshotsInProduct?: Nullable<boolean>, sellerVerifiedPhone?: Nullable<boolean>, sellerVerfiedIdentity?: Nullable<boolean>, gameId?: Nullable<UnsignedInt>, globalCategoryId?: Nullable<UnsignedInt>, visible?: Nullable<boolean>, search?: Nullable<string>, order?: Nullable<string>, showHidden?: Nullable<boolean>): Nullable<PaginatedAdminGameCategories> | Promise<Nullable<PaginatedAdminGameCategories>>;
    gameCategory(id: string): Nullable<GameCategory> | Promise<Nullable<GameCategory>>;
    suggestedGameCategories(pageInfo?: Nullable<PageInfo>, search?: Nullable<string>, gameId?: Nullable<number>, status?: Nullable<SuggestedGameCategoryStatus>, order?: Nullable<string>): Nullable<PaginatedSuggestedGameCategories> | Promise<Nullable<PaginatedSuggestedGameCategories>>;
    games(pageInfo?: Nullable<PageInfo>, search?: Nullable<string>, globalCategoryId?: Nullable<number>, isFavourite?: Nullable<boolean>, type?: Nullable<GameType>, order?: Nullable<string>, showHidden?: Nullable<boolean>, showWithoutGameCategories?: Nullable<boolean>): Nullable<PaginatedGames> | Promise<Nullable<PaginatedGames>>;
    adminGames(pageInfo?: Nullable<PageInfo>, search?: Nullable<string>, globalCategoryId?: Nullable<number>, isFavourite?: Nullable<boolean>, type?: Nullable<GameType>, visible?: Nullable<boolean>, haveChat?: Nullable<boolean>, order?: Nullable<string>, showHidden?: Nullable<boolean>, showWithoutGameCategories?: Nullable<boolean>): Nullable<PaginatedGames> | Promise<Nullable<PaginatedGames>>;
    similarFourGames(id: string): Nullable<Game[]> | Promise<Nullable<Game[]>>;
    game(id: string): Nullable<Game> | Promise<Nullable<Game>>;
    getCountsOnlineAndProducts(): Nullable<CountsOnlineAndProducts> | Promise<Nullable<CountsOnlineAndProducts>>;
    globalCategories(pageInfo?: Nullable<PageInfo>, order?: Nullable<string>, search?: Nullable<string>, type?: Nullable<GlobalCategoryType>, showHidden?: Nullable<boolean>): Nullable<PaginatedGlobalCategories> | Promise<Nullable<PaginatedGlobalCategories>>;
    globalCategory(id: string): Nullable<GlobalCategory> | Promise<Nullable<GlobalCategory>>;
    chatMessages(chatId: UnsignedInt, pageInfo?: Nullable<PageInfo>): PaginatedMessages | Promise<PaginatedMessages>;
    myOrders(pageInfo?: Nullable<PageInfo>, onlySales?: Nullable<boolean>, gameId?: Nullable<number>, gameCategoryId?: Nullable<number>, orderStatus?: Nullable<OrderStatus>, paymentMethod?: Nullable<string>, searchByLoginOrOrderId?: Nullable<string>, order?: Nullable<string>): PaginatedOrders | Promise<PaginatedOrders>;
    orderById(orderId: string): Order | Promise<Order>;
    permissions(): Nullable<Nullable<Permission>[]> | Promise<Nullable<Nullable<Permission>[]>>;
    permission(id: string): Nullable<Permission> | Promise<Nullable<Permission>>;
    myProducts(pageInfo?: Nullable<PageInfo>, autoDelivery?: Nullable<boolean>, hasReviews?: Nullable<boolean>, sellerOnline?: Nullable<boolean>, search?: Nullable<string>, filters?: Nullable<ProductFilterOptionInput[]>, priceFilter?: Nullable<ProductPriceFilterInput>, gameId?: Nullable<number>, firstOrderBy?: Nullable<string>, secondOrderBy?: Nullable<string>, active?: Nullable<boolean>, gameCategoryId?: Nullable<number>, globalCategoryId?: Nullable<number>, mostViewedFirst?: Nullable<boolean>): Nullable<PaginatedMyProducts> | Promise<Nullable<PaginatedMyProducts>>;
    products(pageInfo?: Nullable<PageInfo>, autoDelivery?: Nullable<boolean>, hasReviews?: Nullable<boolean>, sellerOnline?: Nullable<boolean>, search?: Nullable<string>, filters?: Nullable<ProductFilterOptionInput[]>, priceFilter?: Nullable<ProductPriceFilterInput>, sellerId?: Nullable<number>, gameId?: Nullable<number>, firstOrderBy?: Nullable<string>, secondOrderBy?: Nullable<string>, active?: Nullable<boolean>, gameCategoryId?: Nullable<number>, globalCategoryId?: Nullable<number>, isFavourite?: Nullable<boolean>, mostViewedFirst?: Nullable<boolean>): Nullable<PaginatedProducts> | Promise<Nullable<PaginatedProducts>>;
    product(id: UnsignedInt): Nullable<Product> | Promise<Nullable<Product>>;
    lastViewedMyProductsByUserId(userId: number): LastViewedProducts | Promise<LastViewedProducts>;
    productComplaints(pageInfo?: Nullable<PageInfo>, productId?: Nullable<UnsignedInt>, status?: Nullable<ComplaintProductStatus>, userId?: Nullable<UnsignedInt>, sellerId?: Nullable<UnsignedInt>, order?: Nullable<string>): PaginatedProductComplaints | Promise<PaginatedProductComplaints>;
    reviews(pageInfo?: Nullable<PageInfo>, sellerId?: Nullable<number>, productId?: Nullable<number>, type?: Nullable<ReviewType>, score?: Nullable<number>, gameId?: Nullable<number>, gameCategoryId?: Nullable<number>, order?: Nullable<string>): Nullable<PaginatedReviews> | Promise<Nullable<PaginatedReviews>>;
    roles(): Nullable<Nullable<Role>[]> | Promise<Nullable<Nullable<Role>[]>>;
    role(id: string): Nullable<Role> | Promise<Nullable<Role>>;
    tickets(pageInfo?: Nullable<PageInfo>, status?: Nullable<TicketStatus>, topic?: Nullable<TicketTopic>, topicCategory?: Nullable<TicketTopicCategory>, order?: Nullable<string>): PaginatedTickets | Promise<PaginatedTickets>;
    myTickets(pageInfo?: Nullable<PageInfo>, status?: Nullable<TicketStatus>, topic?: Nullable<TicketTopic>, topicCategory?: Nullable<TicketTopicCategory>, order?: Nullable<string>): PaginatedTickets | Promise<PaginatedTickets>;
    ticket(ticketId: number): Ticket | Promise<Ticket>;
    ticketMessages(ticketId: number, pageInfo?: Nullable<PageInfo>): PaginatedTicketMessages | Promise<PaginatedTicketMessages>;
    myTransactions(pageInfo?: Nullable<PageInfo>, onlyPurchases?: Nullable<boolean>, onlySales?: Nullable<boolean>, orderStatus?: Nullable<OrderStatus>, order?: Nullable<string>, gameId?: Nullable<number>, gameCategoryId?: Nullable<number>, searchByLoginOrOrderId?: Nullable<string>, paymentMethod?: Nullable<string>, type?: Nullable<TransactionType>): PaginatedTransactions | Promise<PaginatedTransactions>;
    users(pageInfo?: Nullable<PageInfo>, search?: Nullable<string>, roleId?: Nullable<number>, onlyBuyers?: Nullable<boolean>, onlySellers?: Nullable<boolean>, onlyStaff?: Nullable<boolean>, bgrMin?: Nullable<number>, bgrMax?: Nullable<number>, order?: Nullable<string>): PaginatedUsers | Promise<PaginatedUsers>;
    publicProfile(slug: string): Nullable<PublicProfile> | Promise<Nullable<PublicProfile>>;
    userComplaints(pageInfo?: Nullable<PageInfo>, creatorId?: Nullable<number>, targetId?: Nullable<number>, status?: Nullable<ComplaintUserStatus>, order?: Nullable<string>): PaginatedUserComplaints | Promise<PaginatedUserComplaints>;
    myBlacklist(): PublicProfile[] | Promise<PublicProfile[]>;
}

export interface IMutation {
    pinMyAchievement(achievementId: number, position: number): boolean | Promise<boolean>;
    login(login: string, password: string): Nullable<Tokens> | Promise<Nullable<Tokens>>;
    loginOAuth(provider: OAuthProvider, code: string, deviceId?: Nullable<string>, originalPKCE?: Nullable<string>): Nullable<Tokens> | Promise<Nullable<Tokens>>;
    logout(refreshToken: string): Nullable<boolean> | Promise<Nullable<boolean>>;
    refresh(refreshToken: string): Nullable<Tokens> | Promise<Nullable<Tokens>>;
    registerAccount(email: string, password: string): Nullable<Tokens> | Promise<Nullable<Tokens>>;
    confirmAccount(email: string, code: string): Nullable<User> | Promise<Nullable<User>>;
    generateTwoFactor(password: string): GenerateTwoFactorResponse | Promise<GenerateTwoFactorResponse>;
    enableTwoFactor(code: string): EnableTwoFactorResponse | Promise<EnableTwoFactorResponse>;
    verifyTwoFactor(tempTokenForTwoFactor: string, code: string): Tokens | Promise<Tokens>;
    callMember(memberId: UnsignedInt): boolean | Promise<boolean>;
    createChat(member: UnsignedInt, name?: Nullable<string>): Chat | Promise<Chat>;
    toggleChatNotification(chatId: UnsignedInt): boolean | Promise<boolean>;
    toggleChatCursor(chatId: UnsignedInt): boolean | Promise<boolean>;
    updateComission(comissionId: number, percentage: number): Commission | Promise<Commission>;
    createGameCategory(gameId: UnsignedInt, translations: GameCategoryTranslationInput[], options: GameCategoryOptionInput[], productsQuantityByUser: number, minOrderPrice: number, possiblePercentage: number, sellerVerifiedPhone: boolean, sellerVerfiedIdentity: boolean, allowScreenshotsInProduct: boolean, commentForBuyer?: Nullable<string>, discountForBalancePayment?: Nullable<number>, globalCategoryId?: Nullable<UnsignedInt>, visible?: Nullable<boolean>): Nullable<GameCategory> | Promise<Nullable<GameCategory>>;
    updateGameCategory(id: UnsignedInt, gameId?: Nullable<UnsignedInt>, translations?: Nullable<GameCategoryTranslationInput[]>, productsQuantityByUser?: Nullable<number>, minOrderPrice?: Nullable<number>, possiblePercentage?: Nullable<number>, commentForBuyer?: Nullable<string>, sellerVerifiedPhone?: Nullable<boolean>, discountForBalancePayment?: Nullable<number>, sellerVerfiedIdentity?: Nullable<boolean>, allowScreenshotsInProduct?: Nullable<boolean>, globalCategoryId?: Nullable<UnsignedInt>, visible?: Nullable<boolean>): Nullable<GameCategory> | Promise<Nullable<GameCategory>>;
    addGameCategoryOption(gameCategoryId: UnsignedInt, type: GameOptionType, isRequired: boolean, translations: GameCategoryOptionTranslationInput[], values?: Nullable<GameCategoryOptionValuesInput[]>, rangeMin?: Nullable<number>, rangeMax?: Nullable<number>): Nullable<GameCategoryOption> | Promise<Nullable<GameCategoryOption>>;
    updateGameCategoryOption(id: UnsignedInt, type?: Nullable<GameOptionType>, isRequired?: Nullable<boolean>, values?: Nullable<GameCategoryOptionValuesInput[]>, rangeMin?: Nullable<number>, rangeMax?: Nullable<number>, translations?: Nullable<GameCategoryOptionTranslationInput[]>): Nullable<GameCategoryOption> | Promise<Nullable<GameCategoryOption>>;
    deleteGameCategoryOption(id: UnsignedInt): boolean | Promise<boolean>;
    deleteGameCategory(id: UnsignedInt): boolean | Promise<boolean>;
    createSuggestedGameCategory(gameId: number, name: string, comment?: Nullable<string>): SuggestedGameCategory | Promise<SuggestedGameCategory>;
    approveSuggestedGameCategory(id: number): SuggestedGameCategory | Promise<SuggestedGameCategory>;
    rejectSuggestedGameCategory(id: number): SuggestedGameCategory | Promise<SuggestedGameCategory>;
    createGame(translations: GameTranslationInput[], type: GameType, iconKey: string, bannerKey: string, hideMainSection?: Nullable<boolean>, haveChat?: Nullable<boolean>, visible?: Nullable<boolean>, searches?: Nullable<string[]>): Game | Promise<Game>;
    updateGame(id: string, translations?: Nullable<GameTranslationInput[]>, visible?: Nullable<boolean>, type?: Nullable<GameType>, iconKey?: Nullable<string>, bannerKey?: Nullable<string>, hideMainSection?: Nullable<boolean>, haveChat?: Nullable<boolean>, searches?: Nullable<string[]>): Game | Promise<Game>;
    deleteGame(id: string): boolean | Promise<boolean>;
    addGameToFavourite(gameId: number): boolean | Promise<boolean>;
    removeGameFromFavourite(gameId: number): boolean | Promise<boolean>;
    createGlobalCategory(translations: GlobalCategoryTranslationInput[], visible?: Nullable<boolean>, type?: Nullable<GlobalCategoryType>): GlobalCategory | Promise<GlobalCategory>;
    updateGlobalCategory(id: string, translations?: Nullable<GlobalCategoryTranslationInput[]>, visible?: Nullable<boolean>, type?: Nullable<GlobalCategoryType>): GlobalCategory | Promise<GlobalCategory>;
    deleteGlobalCategory(id: string): boolean | Promise<boolean>;
    createMessage(chatId: UnsignedInt, text: string, files?: Nullable<Nullable<string>[]>): Message | Promise<Message>;
    updateMessage(id: UnsignedInt, text?: Nullable<string>, files?: Nullable<Nullable<string>[]>): Message | Promise<Message>;
    deleteMessage(id: UnsignedInt): boolean | Promise<boolean>;
    markMessageAsRead(id: UnsignedInt): boolean | Promise<boolean>;
    createOrder(productId: string): Order | Promise<Order>;
    makeOrderIsCompletedAndSendMoneyToSeller(orderId?: Nullable<string>): Order | Promise<Order>;
    makeOrderIsProblematic(orderId: string): Order | Promise<Order>;
    makeOrderIsPriority(orderId: string): Order | Promise<Order>;
    reopenOrder(orderId: string): Order | Promise<Order>;
    refundOrder(orderId: string): Order | Promise<Order>;
    createProduct(gameCategoryId: UnsignedInt, price: number, autoDelivery: boolean, options: ProductOptionValueInput[], translations: ProductTranslationInput[], images?: Nullable<string[]>, lots?: Nullable<string[]>, quantity?: Nullable<number>, active?: Nullable<boolean>, deactiveAfterSell?: Nullable<boolean>): Nullable<Product> | Promise<Nullable<Product>>;
    updateProduct(id: UnsignedInt, gameCategoryId?: Nullable<UnsignedInt>, price?: Nullable<number>, autoDelivery?: Nullable<boolean>, options?: Nullable<ProductOptionValueInput[]>, translations?: Nullable<ProductTranslationInput[]>, images?: Nullable<string[]>, lots?: Nullable<string[]>, quantity?: Nullable<number>, active?: Nullable<boolean>, deactiveAfterSell?: Nullable<boolean>): Nullable<Product> | Promise<Nullable<Product>>;
    deleteProduct(id: string): boolean | Promise<boolean>;
    copyProduct(id: UnsignedInt): Nullable<Product> | Promise<Nullable<Product>>;
    liftMyProduct(ids: number[]): number[] | Promise<number[]>;
    importProducts(fileKey: string): ImportedProducts | Promise<ImportedProducts>;
    exportProducts(ids: number[]): string | Promise<string>;
    addProductToFavourites(productId: number): boolean | Promise<boolean>;
    removeProductFromFavourites(productId: number): boolean | Promise<boolean>;
    createComplaintProduct(productId: number, reason: ComplaintProductReasons, comment?: Nullable<string>): boolean | Promise<boolean>;
    approveProductComplaint(id: number): boolean | Promise<boolean>;
    rejectProductComplaint(id: number): boolean | Promise<boolean>;
    createReview(type: ReviewType, speedRating: number, qualityRating: number, accordanceRating: number, communicationRating: number, recommendationRating: number, generalRating: number, text: string, productId?: Nullable<number>, orderId?: Nullable<string>): Nullable<Review> | Promise<Nullable<Review>>;
    updateReview(id: number, speedRating: number, qualityRating: number, accordanceRating: number, communicationRating: number, recommendationRating: number, generalRating: number, text: string): Nullable<Review> | Promise<Nullable<Review>>;
    deleteReview(id: number): Nullable<boolean> | Promise<Nullable<boolean>>;
    createAnswerToReview(reviewId: number, text: string): Nullable<Review> | Promise<Nullable<Review>>;
    updateAnswerToReview(id: number, text: string): Nullable<Review> | Promise<Nullable<Review>>;
    becomeSeller(approval: boolean): boolean | Promise<boolean>;
    createRole(code: string, translations: RoleTranslationInput[], permissions?: Nullable<string[]>): Role | Promise<Role>;
    updateRole(id: string, code?: Nullable<string>, translations?: Nullable<RoleTranslationInput[]>, permissions?: Nullable<string[]>): Role | Promise<Role>;
    deleteRole(id: string): boolean | Promise<boolean>;
    getUploadUrl(mimeType: string, bucket: string): Nullable<UploadUrl> | Promise<Nullable<UploadUrl>>;
    getUploadUrls(uploads: UploadInput[]): Nullable<Nullable<UploadUrl>[]> | Promise<Nullable<Nullable<UploadUrl>[]>>;
    createTicket(topic: TicketTopic, topicCategory: TicketTopicCategory, comment?: Nullable<string>, imagesKeys?: Nullable<Nullable<string>[]>, notifyAboutResolveByEmail?: Nullable<boolean>): Ticket | Promise<Ticket>;
    createTicketMessage(ticketId: number, text: string, filesKeys?: Nullable<Nullable<string>[]>): TicketMessage | Promise<TicketMessage>;
    takeTicket(ticketId: number): boolean | Promise<boolean>;
    resolveTicket(ticketId: number): boolean | Promise<boolean>;
    withdrawalRubles(type: WithdrawalRublesMethods, amount: number, cardNumber?: Nullable<string>, bankId?: Nullable<string>, phone?: Nullable<string>, accountNumber?: Nullable<string>, isInstant?: Nullable<boolean>): boolean | Promise<boolean>;
    getReplenishAccountYooKassaUrl(amount: number, buyProductId?: Nullable<number>): string | Promise<string>;
    buyProductFromBalance(productId: number): Order | Promise<Order>;
    editAccount(login?: Nullable<string>, avatar?: Nullable<string>, locale?: Nullable<Locale>, currency?: Nullable<Currency>): Nullable<User> | Promise<Nullable<User>>;
    assignRole(roleId: string, userId: string): Nullable<User> | Promise<Nullable<User>>;
    removeRole(roleId: string, userId: string): Nullable<User> | Promise<Nullable<User>>;
    requestCode(login: string, type: UserCodeType): Nullable<string> | Promise<Nullable<string>>;
    changePassword(login: string, code: string, password: string, type: UserCodeType): Nullable<boolean> | Promise<Nullable<boolean>>;
    requestCodeForChangeOldPassword(oldPassword: string): Nullable<string> | Promise<Nullable<string>>;
    deleteUser(userId: number, hardRemove?: Nullable<boolean>): Nullable<boolean> | Promise<Nullable<boolean>>;
    createUserComplaint(targetId: number, reason: UserComplaintReason, comment?: Nullable<string>): Nullable<UserComplaint> | Promise<Nullable<UserComplaint>>;
    approveUserComplaint(id: number): boolean | Promise<boolean>;
    rejectUserComplaint(id: number): boolean | Promise<boolean>;
    addUserToBlacklist(bannedUserId: number): boolean | Promise<boolean>;
    removeUserFromBlacklist(bannedUserId: number): boolean | Promise<boolean>;
    setTradingOption(option: UserTradingOption): boolean | Promise<boolean>;
    sendCodeForVerifyPhone(phone: string): VerifyPhoneResult | Promise<VerifyPhoneResult>;
}

export interface Tokens {
    user?: Nullable<User>;
    tempTokenForTwoFactor?: Nullable<string>;
    accessToken?: Nullable<string>;
    refreshToken?: Nullable<string>;
}

export interface GenerateTwoFactorResponse {
    qr: string;
}

export interface EnableTwoFactorResponse {
    backupCodes?: Nullable<string[]>;
}

export interface Chat {
    id: UnsignedInt;
    name?: Nullable<string>;
    members: Nullable<ChatMember>[];
    lastMessage?: Nullable<Message>;
    newMessageCount?: Nullable<number>;
    pinned?: Nullable<boolean>;
    notify?: Nullable<boolean>;
    isSystem?: Nullable<boolean>;
}

export interface ChatMember {
    role?: Nullable<ChatMemberRoles>;
    userId?: Nullable<number>;
    user?: Nullable<User>;
}

export interface PaginatedChats extends Pagination {
    pages: number;
    count: number;
    rows: Chat[];
}

export interface Commission {
    id: number;
    uniqueId: string;
    percentage: number;
    type: ComissionType;
    currency?: Nullable<Currency>;
    method: string;
    translations: ComissionTranslation[];
}

export interface ComissionTranslation {
    locale: Locale;
    method: string;
}

export interface CostCalculated {
    commission: Commission;
    amount: number;
}

export interface CurrencyValue {
    currency?: Nullable<Currency>;
    amount?: Nullable<number>;
}

export interface Finance {
    user: User;
    rub: number;
    usd: number;
    eur: number;
    bonuses: number;
}

export interface GameCategory {
    id: number;
    translations?: Nullable<Nullable<GameCategoryTranslation>[]>;
    slug: string;
    visible: boolean;
    gameId?: Nullable<number>;
    game?: Nullable<Game>;
    globalCategoryId?: Nullable<number>;
    globalCategory?: Nullable<GlobalCategory>;
    allowScreenshotsInProduct?: Nullable<boolean>;
    productsQuantityByUser?: Nullable<number>;
    minOrderPrice?: Nullable<number>;
    possiblePercentage?: Nullable<number>;
    commentForBuyer?: Nullable<string>;
    sellerVerifiedPhone?: Nullable<boolean>;
    sellerVerfiedIdentity?: Nullable<boolean>;
    countMyProducts?: Nullable<number>;
    countProducts?: Nullable<number>;
    name?: Nullable<string>;
    options: GameCategoryOption[];
    createdAt: DateTime;
    updatedAt: DateTime;
    deletedAt?: Nullable<DateTime>;
}

export interface SuggestedGameCategory {
    id: number;
    game: Game;
    name: string;
    comment?: Nullable<string>;
    user: User;
    status?: Nullable<SuggestedGameCategoryStatus>;
}

export interface GameCategoryTranslation {
    locale?: Nullable<Locale>;
    label?: Nullable<string>;
}

export interface GameCategoryOption {
    id: number;
    name: string;
    type: GameOptionType;
    isRequired: boolean;
    values?: Nullable<GameCategoryOptionValue[]>;
    translations?: Nullable<Nullable<GameCategoryOptionTranslation>[]>;
    rangeMin?: Nullable<number>;
    rangeMax?: Nullable<number>;
}

export interface GameCategoryOptionTranslation {
    locale?: Nullable<Locale>;
    name?: Nullable<string>;
}

export interface GameCategoryOptionValue {
    id: number;
    name: string;
    translations?: Nullable<Nullable<GameCategoryOptionValueTranslation>[]>;
}

export interface GameCategoryOptionValueTranslation {
    locale?: Nullable<Locale>;
    name?: Nullable<string>;
}

export interface PaginatedGameCategories extends Pagination {
    pages: number;
    count: number;
    rows: GameCategory[];
}

export interface PaginatedAdminGameCategories extends Pagination {
    pages: number;
    count: number;
    globalCategories: GlobalCategory[];
    rows: GameCategory[];
}

export interface PaginatedSuggestedGameCategories extends Pagination {
    pages: number;
    count: number;
    games?: Nullable<Nullable<Game>[]>;
    rows: SuggestedGameCategory[];
}

export interface Game {
    id: string;
    slug: string;
    visible: boolean;
    name?: Nullable<string>;
    description?: Nullable<string>;
    translations?: Nullable<GameTranslation[]>;
    type: GameType;
    iconKey?: Nullable<string>;
    icon?: Nullable<string>;
    bannerKey?: Nullable<string>;
    banner?: Nullable<string>;
    gameCategories?: Nullable<GameCategory[]>;
    countGameCategories: number;
    countProducts: number;
    hideMainSection: boolean;
    haveChat: boolean;
    isFavourite?: Nullable<boolean>;
    searches?: Nullable<Nullable<string>[]>;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface GameTranslation {
    locale: Locale;
    name: string;
    description: string;
}

export interface PaginatedGames extends Pagination {
    pages: number;
    count: number;
    gameCount?: Nullable<number>;
    mobileGameCount?: Nullable<number>;
    applicationCount?: Nullable<number>;
    rows: Game[];
}

export interface CountsOnlineAndProducts {
    countOnline: number;
    countProducts: number;
}

export interface GlobalCategory {
    id: string;
    name?: Nullable<string>;
    description?: Nullable<string>;
    translations?: Nullable<GlobalCategoryTranslation[]>;
    slug: string;
    visible: boolean;
    type: GlobalCategoryType;
    countGameCategories: number;
    games: Game[];
    products: Product[];
    createdAt: DateTime;
    updatedAt: DateTime;
    deletedAt?: Nullable<DateTime>;
}

export interface GlobalCategoryTranslation {
    locale: Locale;
    name: string;
    description: string;
}

export interface PaginatedGlobalCategories extends Pagination {
    pages: number;
    count: number;
    rows: GlobalCategory[];
}

export interface Message {
    id?: Nullable<UnsignedInt>;
    type?: Nullable<MessageType>;
    text?: Nullable<string>;
    metadata?: Nullable<JSON>;
    userId?: Nullable<number>;
    user?: Nullable<User>;
    isSystem?: Nullable<boolean>;
    product?: Nullable<Product>;
    files?: Nullable<Nullable<string>[]>;
    readedAt?: Nullable<DateTime>;
    createdAt?: Nullable<DateTime>;
    updatedAt?: Nullable<DateTime>;
}

export interface PaginatedMessages extends Pagination {
    pages: number;
    count: number;
    rows: Nullable<Message>[];
}

export interface Order {
    id: string;
    price: number;
    currency: Currency;
    review?: Nullable<Review>;
    productSnapshot: OrderProductSnapshot;
    productLot?: Nullable<string>;
    buyer: User;
    paymentMethod: string;
    status: OrderStatus;
    isPriority: boolean;
    isProblematic: boolean;
    isAlreadyReopened: boolean;
    waitToReopen: boolean;
    createdAt: DateTime;
}

export interface OrderProductSnapshot {
    order: Order;
    originalProduct: Product;
    gameCategory: GameCategory;
    seller: User;
    slug: string;
    price?: Nullable<number>;
    currency: Currency;
    autoDelivery: boolean;
    active: boolean;
    deactiveAfterSell: boolean;
    quantity: number;
    name: string;
    description: string;
    messageForBuyer?: Nullable<string>;
    options?: Nullable<ProductOptionValue[]>;
    translations?: Nullable<Nullable<ProductTranslation>[]>;
    images?: Nullable<Nullable<string>[]>;
}

export interface PaginatedOrders extends Pagination {
    pages: number;
    count: number;
    paymentMethods: string[];
    games: Game[];
    rows: Order[];
}

export interface Permission {
    id: string;
    name: string;
    code: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface Product {
    id: number;
    originalProductId?: Nullable<number>;
    sellerId?: Nullable<number>;
    seller?: Nullable<User>;
    slug: string;
    autoDelivery?: Nullable<boolean>;
    imageKeys?: Nullable<Nullable<string>[]>;
    images?: Nullable<Nullable<string>[]>;
    gameCategoryId?: Nullable<number>;
    gameCategory?: Nullable<GameCategory>;
    price?: Nullable<number>;
    priceWithoutCommission?: Nullable<number>;
    discountForPaymentFromTheBalance?: Nullable<number>;
    options?: Nullable<ProductOptionValue[]>;
    translations?: Nullable<Nullable<ProductTranslation>[]>;
    name?: Nullable<string>;
    lots?: Nullable<Nullable<string>[]>;
    quantity?: Nullable<number>;
    active?: Nullable<boolean>;
    deactiveAfterSell?: Nullable<boolean>;
    description?: Nullable<string>;
    views?: Nullable<number>;
    viewsLast14Days?: Nullable<number>;
    isFavourite?: Nullable<boolean>;
    createdAt: DateTime;
    updatedAt: DateTime;
    lastLiftingAt?: Nullable<DateTime>;
}

export interface ProductTranslation {
    locale: Locale;
    name?: Nullable<string>;
    description?: Nullable<string>;
    messageForBuyer?: Nullable<string>;
}

export interface ProductOptionValue {
    gameCategoryOptionId: number;
    gameCategoryOption: GameCategoryOption;
    valueString?: Nullable<string>;
    value: string;
}

export interface PaginatedProducts extends Pagination {
    pages: number;
    count: number;
    games: Game[];
    gameCategories: GameCategory[];
    rows: Product[];
}

export interface PaginatedMyProducts extends Pagination {
    pages: number;
    count: number;
    games: Game[];
    gameCategories: GameCategory[];
    rows: Product[];
}

export interface LastViewedProducts {
    watchingItRightNow?: Nullable<Product>;
    watchedThreeProducts: Product[];
}

export interface ImportedProductsErrors {
    row: number;
    error: string;
}

export interface ImportedProducts {
    createdCount: number;
    created: number[];
    errors: ImportedProductsErrors[];
}

export interface ProductComplaint {
    id: number;
    product: Product;
    user: User;
    reason: ComplaintProductReasons;
    comment?: Nullable<string>;
    status: ComplaintProductStatus;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface PaginatedProductComplaints extends Pagination {
    pages: number;
    count: number;
    rows: ProductComplaint[];
}

export interface Review {
    id: number;
    type: ReviewType;
    rating?: Nullable<number>;
    speedRating?: Nullable<number>;
    qualityRating?: Nullable<number>;
    accordanceRating?: Nullable<number>;
    communicationRating?: Nullable<number>;
    recommendationRating?: Nullable<number>;
    generalRating?: Nullable<number>;
    text: string;
    userId?: Nullable<number>;
    user?: Nullable<User>;
    productId?: Nullable<number>;
    product?: Nullable<Product>;
    orderId?: Nullable<string>;
    order?: Nullable<Order>;
    reviewId?: Nullable<number>;
    replyTo?: Nullable<Review>;
    sellerAnswer?: Nullable<Review>;
    createdAt?: Nullable<DateTime>;
    updatedAt?: Nullable<DateTime>;
}

export interface PaginatedReviews {
    count?: Nullable<number>;
    pages?: Nullable<number>;
    ratings?: Nullable<Ratings>;
    games?: Nullable<Nullable<Game>[]>;
    gameCategories?: Nullable<Nullable<GameCategory>[]>;
    rows?: Nullable<Nullable<Review>[]>;
}

export interface Ratings {
    five?: Nullable<number>;
    four?: Nullable<number>;
    three?: Nullable<number>;
    two?: Nullable<number>;
    one?: Nullable<number>;
}

export interface Role {
    id: string;
    code: string;
    name: string;
    permissions?: Nullable<Nullable<Permission>[]>;
    translations?: Nullable<Nullable<RoleTranslation>[]>;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface RoleTranslation {
    locale: Locale;
    name: string;
}

export interface UploadUrl {
    uploadUrl: string;
    fileKey: string;
}

export interface Ticket {
    id: number;
    topic: TicketTopic;
    topicCategory: TicketTopicCategory;
    comment?: Nullable<string>;
    images?: Nullable<Nullable<string>[]>;
    status: TicketStatus;
    author: User;
    employee?: Nullable<User>;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface TicketMessage {
    user: User;
    text: string;
    files?: Nullable<Nullable<string>[]>;
}

export interface PaginatedTickets extends Pagination {
    count: number;
    pages: number;
    countOpened: number;
    countResolved: number;
    rows: Ticket[];
}

export interface PaginatedTicketMessages extends Pagination {
    count: number;
    pages: number;
    rows: TicketMessage[];
}

export interface Transaction {
    id: string;
    finance: Finance;
    order?: Nullable<Order>;
    amount: number;
    currency: Currency;
    type: TransactionType;
    updatedAt: DateTime;
    createdAt: DateTime;
}

export interface PaginatedTransactions extends Pagination {
    pages: number;
    count: number;
    paymentMethods: string[];
    rows: Transaction[];
}

export interface BgrHistory {
    date?: Nullable<DateTime>;
    bgr?: Nullable<number>;
}

export interface User {
    id: string;
    login?: Nullable<string>;
    email?: Nullable<string>;
    roles?: Nullable<Nullable<Role>[]>;
    phone?: Nullable<string>;
    verified?: Nullable<boolean>;
    verifiedIdentity?: Nullable<boolean>;
    avatarKey?: Nullable<string>;
    avatar?: Nullable<string>;
    selectedLocale?: Nullable<Locale>;
    selectedCurrency?: Nullable<Currency>;
    isOnline?: Nullable<boolean>;
    activeFinanceAmount?: Nullable<number>;
    countProducts?: Nullable<number>;
    countReviews?: Nullable<number>;
    countReviewsForLastYear?: Nullable<number>;
    averageRating?: Nullable<number>;
    bgr?: Nullable<number>;
    bgrHistory?: Nullable<Nullable<BgrHistory>[]>;
    bgrRank?: Nullable<number>;
    buyerPurchasesRank?: Nullable<number>;
    averageSumOfSales?: Nullable<number>;
    quantityOfSalesForLast14Days?: Nullable<number>;
    averageSumOfSalesForLast14Days?: Nullable<number>;
    percentOfSuccessOrdersForLast14Days?: Nullable<number>;
    quantityOfSales?: Nullable<number>;
    percentOfSuccessOrders?: Nullable<number>;
    quantityOfPurchases?: Nullable<number>;
    quantityOfPurchasesForLast14Days?: Nullable<number>;
    averageSumOfPurchases?: Nullable<number>;
    averageSumOfPurchasesForLast14Days?: Nullable<number>;
    percentOfSuccessPurchases?: Nullable<number>;
    percentOfSuccessPurchasesForLast14Days?: Nullable<number>;
    securityDeposit?: Nullable<number>;
    dateWhenCanBeLiftedProduct?: Nullable<DateTime>;
    inYourBlacklist?: Nullable<boolean>;
    selectedTradingOption?: Nullable<UserTradingOption>;
    lastSeen?: Nullable<DateTime>;
    createdAt?: Nullable<DateTime>;
    updatedAt?: Nullable<DateTime>;
    deletedAt?: Nullable<DateTime>;
}

export interface PublicProfile {
    id: string;
    login?: Nullable<string>;
    roles?: Nullable<Nullable<Role>[]>;
    verified?: Nullable<boolean>;
    avatarKey?: Nullable<string>;
    avatar?: Nullable<string>;
    quantityOfSales?: Nullable<number>;
    percentOfSuccessOrders?: Nullable<number>;
    isOnline?: Nullable<boolean>;
    countReviews?: Nullable<number>;
    countReviewsForLastYear?: Nullable<number>;
    averageRating?: Nullable<number>;
    bgr?: Nullable<number>;
    bgrHistory?: Nullable<Nullable<BgrHistory>[]>;
    bgrRank?: Nullable<number>;
    buyerPurchasesRank?: Nullable<number>;
    averageSumOfSales?: Nullable<number>;
    quantityOfSalesForLast14Days?: Nullable<number>;
    averageSumOfSalesForLast14Days?: Nullable<number>;
    percentOfSuccessOrdersForLast14Days?: Nullable<number>;
    quantityOfPurchases?: Nullable<number>;
    quantityOfPurchasesForLast14Days?: Nullable<number>;
    averageSumOfPurchases?: Nullable<number>;
    averageSumOfPurchasesForLast14Days?: Nullable<number>;
    percentOfSuccessPurchases?: Nullable<number>;
    percentOfSuccessPurchasesForLast14Days?: Nullable<number>;
    securityDeposit?: Nullable<number>;
    inYourBlacklist?: Nullable<boolean>;
    lastSeen?: Nullable<DateTime>;
    createdAt?: Nullable<DateTime>;
    deletedAt?: Nullable<DateTime>;
}

export interface PaginatedBannedAccounts {
    pages?: Nullable<number>;
    count?: Nullable<number>;
    rows?: Nullable<Nullable<User>[]>;
}

export interface UserComplaint {
    id: string;
    creator: User;
    target: User;
    reason: UserComplaintReason;
    comment?: Nullable<string>;
    status: ComplaintUserStatus;
}

export interface PaginatedUserComplaints extends Pagination {
    pages: number;
    count: number;
    rows?: Nullable<Nullable<UserComplaint>[]>;
}

export interface PaginatedUsers extends Pagination {
    pages: number;
    count: number;
    roles?: Nullable<Nullable<Role>[]>;
    rows?: Nullable<Nullable<User>[]>;
}

export interface VerifyPhoneResult {
    message?: Nullable<string>;
}

export type AccountNumber = any;
export type BigInt = any;
export type Byte = any;
export type CountryCode = any;
export type CountryName = any;
export type Cuid = any;
export type DateTime = any;
export type DateTimeISO = any;
export type DeweyDecimal = any;
export type DID = any;
export type Duration = any;
export type EmailAddress = any;
export type GeoJSON = any;
export type GUID = any;
export type Hexadecimal = any;
export type HexColorCode = any;
export type HSL = any;
export type HSLA = any;
export type IBAN = any;
export type IP = any;
export type IPCPatent = any;
export type IPv4 = any;
export type IPv6 = any;
export type ISBN = any;
export type ISO8601Duration = any;
export type JSON = any;
export type JSONObject = any;
export type JWT = any;
export type Latitude = any;
export type LCCSubclass = any;
export type LocalDate = any;
export type LocalDateTime = any;
export type LocalEndTime = any;
export type LocalTime = any;
export type Long = any;
export type Longitude = any;
export type MAC = any;
export type NegativeFloat = any;
export type NegativeInt = any;
export type NonEmptyString = any;
export type NonNegativeFloat = any;
export type NonNegativeInt = any;
export type NonPositiveFloat = any;
export type NonPositiveInt = any;
export type ObjectID = any;
export type PhoneNumber = any;
export type Port = any;
export type PositiveFloat = any;
export type PositiveInt = any;
export type PostalCode = any;
export type RGB = any;
export type RGBA = any;
export type RoutingNumber = any;
export type SafeInt = any;
export type SemVer = any;
export type SESSN = any;
export type Time = any;
export type Timestamp = any;
export type TimeZone = any;
export type UnsignedFloat = any;
export type UnsignedInt = any;
export type URL = any;
export type USCurrency = any;
export type UtcOffset = any;
export type UUID = any;
export type Void = any;
type Nullable<T> = T | null;
