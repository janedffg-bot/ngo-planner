const { createApp, ref, computed } = Vue;

// 範例資料結構（簡化）
const initialTripData = {
    // 每日行程的範例資料...
    dailyItineraries: {
        '2026-02-04': [
            { type: 'flight', name: 'TPE 第一航廈起飛', time: '12:00', details: { note: '桃園國際機場(TPE) - 名古屋中部國際機場(NGO)' } },
            { type: 'transport', name: '購買新特麗亞套票', time: '15:35', location: '中部國際機場國內航廈2樓', details: { note: '機場-岐阜(鐵路)-高山(巴士)' } },
            { type: 'meal', name: '晚餐：自訂', time: '19:00', details: { note: '高山市區' } },
        ],
        '2026-02-05': [
            { type: 'attraction', name: '宮川朝市', time: '9:30', location: '岐阜県高山市', details: { note: '請注意保暖，並準備前往新穗高' } },
            { type: 'transport', name: '濃飛巴士往新穗高', time: '11:40', location: '濃飛巴士站', details: { note: '在H64 新穂高溫泉下車, 票價 2200' } },
            { type: 'attraction', name: '雪屋祭', time: '19:00', location: '新穗高溫泉中尾', details: { note: '新穗高溫泉中尾雪屋祭' } },
        ],
        '2026-02-06': [
             { type: 'attraction', name: '新穗高纜車', time: '9:00', location: '新穗高高空纜車', details: { note: '欣賞北阿爾卑斯雪景' } },
             { type: 'meal', name: '高山清酒廠巡禮', time: '15:00', location: '原田酒造場', details: { note: '試飲活動' } },
             { type: 'meal', name: '晚餐：味の与平', time: '18:30', location: '岐阜県高山市上三之町105', details: { note: '本店官網菜單' } },
        ],
    },
    // 住宿資訊
    accommodations: [
        { date: '2/4', name: 'ホテルアマネク飛騨高山', address: '岐阜県高山市花里町４‐７５‐３', tel: '0577-36-2222' },
        { date: '2/5', name: 'ホテル穂高', address: '岐阜県高山市奥飛騨温泉郷新穂高温泉', tel: '0578-89-2001' },
        { date: '2/6', name: 'ホテルアマネク飛騨高山', address: '岐阜県高山市花里町４‐７５‐３', tel: '0577-36-2222' },
        { date: '2/7 ~ 2/8', name: 'ベストウェスタンプラス名古屋栄', address: '愛知県名古屋市中区栄４丁目６－１', tel: '052-262-6000' },
    ],
    // 購物清單 (簡易結構)
    shoppingList: [
        { name: 'Moflin (シルバー)', location: 'ビックカメラ名古屋駅西店', price: 39800, acquired: false },
        { name: '清酒', location: '高山老街', price: null, acquired: false },
    ],
    // 花費記錄 (簡易結構)
    expenses: [
        { category: '交通', name: '新特麗亞套票', date: '2026-02-04', amount: 5500, method: '現金', note: '機場-高山' },
        { category: '住宿', name: 'ホテルアマネク飛騨高山 (2晚)', date: '2026-02-04', amount: 30000, method: '信用卡', note: '總住宿費的一部分' },
    ],
    // 當前匯率 (例如：1 JPY = 0.22 TWD)
    exchangeRate: 0.22, 
};

// 核心 Vue App
const App = {
    setup() {
        // 核心狀態
        const activeTab = ref('itinerary'); // 當前分頁：'itinerary', 'info', 'shopping', 'expense'
        const tripData = ref(initialTripData);
        const selectedDate = ref('2026-02-04'); // 當前選擇的日期
        const jpyInput = ref(0); // 匯率換算輸入

        // Tab 按鈕定義
        const tabs = [
            { id: 'itinerary', icon: 'fa-map-pin', label: '行程' },
            { id: 'info', icon: 'fa-circle-info', label: '資訊' },
            { id: 'shopping', icon: 'fa-cart-shopping', label: '購物' },
            { id: 'expense', icon: 'fa-sack-dollar', label: '花費' },
        ];

        // 日期選單 (使用行程數據的鍵來生成)
        const dateOptions = computed(() => {
            return Object.keys(tripData.value.dailyItineraries).map(dateStr => {
                const date = new Date(dateStr);
                const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
                return {
                    full: dateStr,
                    day: dayNames[date.getDay()], // 星期
                    date: date.getDate(), // 日期數字
                };
            });
        });

        // 當日行程
        const currentItinerary = computed(() => {
            return tripData.value.dailyItineraries[selectedDate.value] || [];
        });

        // 總花費計算
        const totalExpenseJPY = computed(() => {
             return tripData.value.expenses.reduce((sum, item) => sum + item.amount, 0);
        });
        
        // 匯率換算邏輯
        const convertedTWD = computed(() => {
            const jpy = parseFloat(jpyInput.value);
            if (isNaN(jpy) || jpy <= 0) return '0.00';
            return (jpy * tripData.value.exchangeRate).toFixed(2);
        });

        // 總花費換算
        const totalExpenseTWD = computed(() => {
            return (totalExpenseJPY.value * tripData.value.exchangeRate).toFixed(0);
        });

        // 點擊行程卡片開啟 Google Maps 導航
        const navigateTo = (location) => {
            if (location) {
                // 此處使用 Google Maps 搜尋 URL，若要精確導航需啟用 API
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
                window.open(mapUrl, '_blank');
            } else {
                alert('沒有提供導航位置資訊。');
            }
        };
        
        // 切換日期
        const selectDate = (dateStr) => {
            selectedDate.value = dateStr;
        };

        return {
            activeTab,
            tabs,
            dateOptions,
            selectedDate,
            currentItinerary,
            tripData,
            navigateTo,
            convertedTWD,
            jpyInput,
            totalExpenseJPY,
            totalExpenseTWD,
            selectDate,
        };
    },
    template: `
        <div class="relative">
            <div class="h-[250px] overflow-hidden">
                <img src="gassho_winter_banner.jpg" 
                     alt="合掌村冬日雪景" 
                     class="w-full h-full object-cover">
            </div>
            
            <div class="header-mask absolute bottom-[-50px] w-full bg-ice-blue-light"></div>

            <div class="absolute right-4 bottom-[-75px] z-20 flex space-x-2 p-2 bg-white/90 rounded-xl shadow-xl">
                <button v-for="tab in tabs" :key="tab.id" 
                        @click="activeTab = tab.id" 
                        :class="['w-16 h-16 rounded-lg flex flex-col items-center justify-center transition-colors text-xs', activeTab === tab.id ? 'bg-accent-blue text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100']">
                    <i :class="['fas text-xl', tab.icon]"></i>
                    <span class="mt-1">{{ tab.label }}</span>
                </button>
            </div>
        </div>

        <main class="pt-[75px] p-4 bg-ice-blue-light min-h-[calc(100vh-250px)]">
            
            <div v-if="activeTab === 'itinerary'">
                <div class="flex overflow-x-auto space-x-3 pb-3 mb-4 scrollbar-hide">
                    <div v-for="date in dateOptions" :key="date.full" 
                         @click="selectDate(date.full)"
                         :class="['flex-shrink-0 p-3 rounded-xl cursor-pointer text-center transition-all min-w-[70px]', selectedDate === date.full ? 'bg-accent-blue text-white shadow-md' : 'bg-white text-gray-700 hover:shadow']">
                        <div class="font-black text-xl leading-none">{{ date.day }}</div>
                        <div class="text-sm">{{ date.date }}</div>
                    </div>
                </div>

                <div class="mb-6 p-4 bg-ice-blue-dark rounded-xl shadow-md flex items-center justify-between border-l-4 border-accent-blue">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-snowflake text-4xl text-blue-400"></i> <div>
                            <p class="text-sm text-gray-500">{{ selectedDate }} 天氣 (高山/名古屋)</p>
                            <p class="text-2xl font-bold text-gray-800">1°C / -5°C</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600">體感: -3°C</p>
                </div>

                <div v-if="currentItinerary.length" class="space-y-4">
                    <div v-for="(item, index) in currentItinerary" :key="index">
                        
                        <div v-if="index > 0" class="flex items-center justify-center space-x-2 text-sm text-gray-500 my-2">
                            <i class="fas fa-route"></i>
                            <span class="font-semibold">~ 35 分鐘</span>
                            <i class="fas fa-bus-simple"></i>
                        </div>

                        <div @click="navigateTo(item.location || item.details?.note)"
                             :class="['p-4 rounded-xl shadow-lg transition-shadow cursor-pointer border-l-4', 
                                      item.type === 'flight' ? 'bg-accent-blue text-white border-white' : 'bg-white hover:shadow-xl border-accent-blue']">
                            
                            <div v-if="item.type === 'flight'" class="flex justify-between items-start">
                                <div>
                                    <p class="text-sm font-semibold opacity-80">🛫 {{ item.details?.note }}</p>
                                    <h3 class="text-2xl font-black mt-1">{{ item.time }}</h3>
                                    <p class="text-xs opacity-80">航班編號: CIxxxx (模擬)</p>
                                </div>
                                <i class="fas fa-plane text-4xl opacity-70"></i>
                            </div>
                            
                            <div v-else>
                                <div class="flex justify-between items-start mb-2">
                                    <h3 class="text-lg font-bold">{{ item.name }}</h3>
                                    <span class="text-sm font-semibold" :class="item.type === 'flight' ? 'text-white' : 'text-accent-blue'">{{ item.time || '全日' }}</span>
                                </div>
                                <p class="text-sm text-gray-600 truncate" :class="item.type === 'flight' ? 'text-white/80' : 'text-gray-600'">
                                    {{ item.details?.note || '點擊導航' }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <button class="fixed right-6 bottom-6 w-14 h-14 bg-accent-blue text-white rounded-full shadow-2xl transition-transform hover:scale-110 z-30">
                    <i class="fas fa-plus text-2xl"></i>
                </button>
            </div>
            
            <div v-else-if="activeTab === 'info'">
                <h2 class="text-2xl font-bold mb-6 text-gray-700">ℹ️ 資訊中心</h2>

                <div class="p-4 bg-white rounded-xl shadow-lg mb-6 border-l-4 border-accent-blue">
                    <h3 class="text-xl font-bold mb-3 text-accent-blue">💰 匯率換算</h3>
                    <p class="text-sm text-gray-500 mb-2">當日匯率： 1 JPY ≈ {{ tripData.exchangeRate }} TWD</p>
                    <div class="flex space-x-2 items-center">
                        <input type="number" v-model="jpyInput" placeholder="日幣金額 (JPY)" class="flex-grow p-3 border rounded-lg focus:ring-accent-blue focus:border-accent-blue" />
                        <span class="text-lg font-bold">=</span>
                        <div class="p-3 font-bold text-lg bg-ice-blue-light rounded-lg text-gray-800">
                           NT$ {{ convertedTWD }}
                        </div>
                    </div>
                </div>
                
                <div class="p-4 bg-white rounded-xl shadow-lg mb-6 border-l-4 border-accent-blue">
                    <h3 class="text-xl font-bold mb-3 text-accent-blue">🏠 住宿資訊</h3>
                    <div v-for="acc in tripData.accommodations" :key="acc.date" class="border-b last:border-b-0 py-3">
                        <p class="font-bold">{{ acc.date }} - {{ acc.name }}</p>
                        <p class="text-sm text-gray-600">地址: {{ acc.address }}</p>
                        <div class="flex justify-between items-center text-sm mt-1">
                            <span class="text-gray-500">電話: {{ acc.tel }}</span>
                            <a href="#" @click.prevent="navigateTo(acc.address)" class="font-semibold text-accent-blue hover:underline"><i class="fas fa-location-dot"></i> 導航</a>
                        </div>
                    </div>
                </div>

                <div class="p-4 bg-white rounded-xl shadow-lg border-l-4 border-red-400">
                    <h3 class="text-xl font-bold mb-3 text-red-500">🚨 緊急聯絡</h3>
                    <p class="text-sm mb-1">日本警察： 110</p>
                    <p class="text-sm">日本救護車/火警： 119</p>
                </div>
            </div>

            <div v-else-if="activeTab === 'shopping'">
                 <h2 class="text-2xl font-bold mb-6 text-gray-700">🛍️ 購物清單</h2>
                 
                 <div class="space-y-3">
                    <div v-for="(item, index) in tripData.shoppingList" :key="index"
                         class="p-4 bg-white rounded-xl shadow-md flex justify-between items-center transition-all hover:bg-ice-blue-dark">
                        <div>
                            <p class="font-semibold" :class="{ 'line-through text-gray-500': item.acquired }">{{ item.name }}</p>
                            <p class="text-xs text-gray-500">{{ item.location }} <span v-if="item.price"> (¥ {{ item.price }})</span></p>
                        </div>
                        <button class="text-accent-blue"><i class="fas fa-check-circle text-xl" :class="{ 'text-green-500': item.acquired }"></i></button>
                    </div>
                 </div>
                 
                 <button class="fixed right-6 bottom-6 w-14 h-14 bg-accent-blue text-white rounded-full shadow-2xl transition-transform hover:scale-110 z-30">
                    <i class="fas fa-plus text-2xl"></i>
                 </button>
            </div>

            <div v-else-if="activeTab === 'expense'">
                 <h2 class="text-2xl font-bold mb-6 text-gray-700">💸 花費記錄</h2>
                 <div class="p-4 bg-accent-blue text-white rounded-xl shadow-lg mb-6 text-center">
                    <p class="text-sm opacity-80">總花費 (日幣 / 台幣)</p>
                    <p class="text-3xl font-black">¥ {{ totalExpenseJPY.toLocaleString() }} (~NT$ {{ totalExpenseTWD.toLocaleString() }})</p>
                 </div>
                 
                 <div class="space-y-3">
                    <div v-for="(item, index) in tripData.expenses" :key="index"
                         class="p-4 bg-white rounded-xl shadow-md flex justify-between items-center border-l-4 border-gray-300 transition-all hover:shadow-lg">
                        <div>
                            <p class="font-bold">{{ item.name }} ({{ item.category }})</p>
                            <p class="text-sm text-gray-600">{{ item.date }} / {{ item.method }}</p>
                        </div>
                        <p class="text-lg font-bold text-red-500">¥ {{ item.amount.toLocaleString() }}</p>
                    </div>
                 </div>
                 
                 <button class="fixed right-6 bottom-6 w-14 h-14 bg-accent-blue text-white rounded-full shadow-2xl transition-transform hover:scale-110 z-30">
                    <i class="fas fa-plus text-2xl"></i>
                 </button>
            </div>

        </main>
    `,
};

createApp(App).mount('#app');
