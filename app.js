const { createApp, ref, computed } = Vue;

// 範例資料結構（簡化）
const initialTripData = {
    // 每日行程的範例資料...
    dailyItineraries: {
        '2026-02-04': [
            { type: 'flight', name: 'TPE 第一航廈起飛', time: '12:00', details: { ... } },
            { type: 'transport', name: '購買新特麗亞套票', details: { ... } },
            // ...
        ],
        '2026-02-05': [
            { type: 'attraction', name: '宮川朝市', time: '9:30', location: '岐阜県高山市', details: { ... } },
            // ...
        ],
        // ... 其他日期的行程
    },
    // 住宿資訊
    accommodations: [
        { date: '2/4', name: 'ホテルアマネク飛騨高山', address: '岐阜県高山市花里町４‐７５‐３' },
        // ...
    ],
    // 購物清單 (簡易結構)
    shoppingList: [],
    // 花費記錄 (簡易結構)
    expenses: [],
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
                    day: dayNames[date.getDay()],
                    date: date.getDate(),
                };
            });
        });

        // 當日行程
        const currentItinerary = computed(() => {
            return tripData.value.dailyItineraries[selectedDate.value] || [];
        });

        // --- 功能方法（僅展示架構）---

        // 點擊行程卡片開啟 Google Maps 導航
        const navigateTo = (address) => {
            // 實際應使用 Google Maps API 服務或直接導向 Google Maps URL
            const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
            window.open(mapUrl, '_blank');
        };

        // 匯率換算邏輯 (簡化)
        const convertToTWD = (jpy) => {
            return (jpy * tripData.value.exchangeRate).toFixed(2);
        };
        
        // 切換日期
        const selectDate = (dateStr) => {
            selectedDate.value = dateStr;
        };

        // ... 其他功能方法 (新增行程、編輯、刪除、拖曳邏輯等)

        return {
            activeTab,
            tabs,
            dateOptions,
            selectedDate,
            currentItinerary,
            tripData,
            navigateTo,
            convertToTWD,
            selectDate,
        };
    },
    template: `
        <div class="relative">
            <div class="h-[250px] overflow-hidden">
                <img src="YOUR_GAHHO_VILLAGE_WINTER_IMAGE_URL" 
                     alt="合掌村冬日雪景" 
                     class="w-full h-full object-cover">
            </div>
            
            <div class="header-mask absolute bottom-[-50px] w-full bg-white bg-ice-blue-light"></div>

            <div class="absolute right-4 bottom-[-75px] z-20 flex space-x-2 p-2 bg-white/90 rounded-xl shadow-xl">
                <button v-for="tab in tabs" :key="tab.id" 
                        @click="activeTab = tab.id" 
                        :class="['w-16 h-16 rounded-lg flex flex-col items-center justify-center transition-colors', activeTab === tab.id ? 'bg-accent-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-100']">
                    <i :class="['fas text-xl', tab.icon]"></i>
                    <span class="text-xs mt-1">{{ tab.label }}</span>
                </button>
            </div>
        </div>

        <main class="pt-[75px] p-4 bg-ice-blue-light min-h-[calc(100vh-250px)]">
            
            <div v-if="activeTab === 'itinerary'">
                <h2 class="text-2xl font-bold mb-4 text-gray-700">🗓️ 每日行程</h2>

                <div class="flex overflow-x-auto space-x-3 pb-3 mb-4 scrollbar-hide">
                    <div v-for="date in dateOptions" :key="date.full" 
                         @click="selectDate(date.full)"
                         :class="['flex-shrink-0 p-3 rounded-xl cursor-pointer text-center transition-all', selectedDate === date.full ? 'bg-accent-blue text-white shadow-md' : 'bg-white text-gray-700 hover:shadow']">
                        <div class="font-black text-lg leading-none">{{ date.date }}</div>
                        <div class="text-sm">{{ date.day }}</div>
                    </div>
                </div>

                <div class="mb-4 p-4 bg-ice-blue-dark rounded-xl shadow-md flex items-center justify-between border-l-4 border-accent-blue">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-cloud-sun text-4xl text-yellow-500"></i> <div>
                            <p class="text-sm text-gray-500">{{ selectedDate }} 天氣</p>
                            <p class="text-2xl font-bold text-gray-800">1°C / -5°C</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600">體感: -3°C</p>
                </div>

                <div v-if="currentItinerary.length" class="space-y-4">
                    <div v-for="(item, index) in currentItinerary" :key="index">
                        
                        <div v-if="index > 0" class="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-2">
                            <i class="fas fa-route"></i>
                            <span class="font-semibold">35 分鐘</span>
                            <i class="fas fa-bus-simple"></i>
                        </div>

                        <div @click="item.location && navigateTo(item.location || item.details?.address)"
                             :class="['p-4 rounded-xl shadow-md transition-shadow cursor-pointer', 
                                      item.type === 'flight' ? 'bg-accent-blue text-white' : 'bg-white hover:shadow-lg']">
                            
                            <div v-if="item.type === 'flight'" class="flex justify-between items-start">
                                <div>
                                    <p class="text-xs font-semibold opacity-80">起飛 (TPE) | 抵達 (NGO)</p>
                                    <p class="text-3xl font-black mt-1">{{ item.time }}</p>
                                </div>
                                <i class="fas fa-plane text-4xl opacity-70"></i>
                            </div>
                            
                            <div v-else>
                                <div class="flex justify-between items-start mb-2">
                                    <h3 class="text-lg font-bold">{{ item.name }}</h3>
                                    <span class="text-sm font-semibold text-accent-blue">{{ item.time || '全日' }}</span>
                                </div>
                                <p class="text-sm text-gray-600 truncate">
                                    {{ item.details?.address || item.details?.note || '點擊導航' }}
                                </p>
                                </div>
                        </div>
                    </div>
                </div>

                <button class="fixed right-6 bottom-6 w-14 h-14 bg-accent-blue text-white rounded-full shadow-2xl transition-transform hover:scale-105 z-30">
                    <i class="fas fa-plus text-2xl"></i>
                </button>
            </div>
            
            <div v-if="activeTab === 'info'">
                <h2 class="text-2xl font-bold mb-4 text-gray-700">ℹ️ 資訊</h2>

                <div class="p-4 bg-white rounded-xl shadow-md mb-4">
                    <h3 class="text-xl font-bold mb-2 text-accent-blue">💰 匯率換算 (1 JPY = {{ tripData.exchangeRate }} TWD)</h3>
                    <div class="flex space-x-2 items-center">
                        <input type="number" placeholder="日幣金額 (JPY)" class="flex-grow p-2 border rounded-lg focus:ring-accent-blue focus:border-accent-blue" />
                        <span class="text-lg font-bold">=</span>
                        <div class="p-2 font-bold text-lg bg-ice-blue-light rounded-lg">
                           {{ convertToTWD(1000) }} TWD </div>
                    </div>
                </div>
                
                <div class="p-4 bg-white rounded-xl shadow-md mb-4">
                    <h3 class="text-xl font-bold mb-2 text-accent-blue">🏠 住宿資訊</h3>
                    <div v-for="acc in tripData.accommodations" :key="acc.date" class="border-b last:border-b-0 py-2">
                        <p class="font-bold">{{ acc.date }} - {{ acc.name }}</p>
                        <p class="text-sm text-gray-600">{{ acc.address }}</p>
                        <a href="#" @click.prevent="navigateTo(acc.address)" class="text-sm text-accent-blue hover:underline">導航</a>
                    </div>
                </div>

            </div>

            <div v-if="activeTab === 'shopping'">
                 <h2 class="text-2xl font-bold mb-4 text-gray-700">🛍️ 購物清單</h2>
                 <div class="space-y-3">
                    <div class="p-4 bg-white rounded-xl shadow-md flex justify-between items-center">
                        <p class="font-semibold">Moflin 絨毛機器人</p>
                        <button class="text-red-500"><i class="fas fa-trash"></i></button>
                    </div>
                    </div>
                 
                 <button class="fixed right-6 bottom-6 w-14 h-14 bg-accent-blue text-white rounded-full shadow-2xl transition-transform hover:scale-105 z-30">
                    <i class="fas fa-plus text-2xl"></i>
                 </button>
            </div>

            <div v-if="activeTab === 'expense'">
                 <h2 class="text-2xl font-bold mb-4 text-gray-700">💸 花費記錄</h2>
                 <div class="p-4 bg-accent-blue text-white rounded-xl shadow-lg mb-4 text-center">
                    <p class="text-sm opacity-80">總花費</p>
                    <p class="text-3xl font-black">¥ 55,000 (~NT$ {{ convertToTWD(55000) }})</p>
                 </div>
                 
                 <div class="space-y-3">
                    <div class="p-4 bg-white rounded-xl shadow-md flex justify-between items-center">
                        <div>
                            <p class="font-bold">🚌 濃飛巴士 (交通)</p>
                            <p class="text-sm text-gray-600">2026-02-04 / 現金</p>
                        </div>
                        <p class="text-lg font-bold text-red-500">¥ 3,300</p>
                    </div>
                    </div>
                 
                 <button class="fixed right-6 bottom-6 w-14 h-14 bg-accent-blue text-white rounded-full shadow-2xl transition-transform hover:scale-105 z-30">
                    <i class="fas fa-plus text-2xl"></i>
                 </button>
            </div>

        </main>
    `,
};

createApp(App).mount('#app');
