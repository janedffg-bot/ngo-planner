const { createApp, ref, computed } = Vue;

// --- 範例行程數據 (維持六天，後三天為空白框架) ---
const initialTripData = {
    dailyItineraries: {
        '2026-02-04': [
            { id: 1, type: 'flight', name: 'TPE 第一航廈起飛', time: '12:00', location: '桃園國際機場(TPE) - 名古屋中部國際機場(NGO)', details: { note: '表定: Choooo (國泰)' } },
            { id: 2, type: 'transport', name: '購買新特麗亞套票', time: '15:35', location: '中部國際機場國內航廈2樓', details: { note: '機場-岐阜(鐵路)-高山(巴士)' } },
            { id: 3, type: 'meal', name: '晚餐：自訂', time: '19:00', location: '高山市區', details: { note: '飛驒牛或蕎麥麵' } },
        ],
        '2026-02-05': [
            { id: 4, type: 'attraction', name: '宮川朝市', time: '9:30', location: '岐阜県高山市', details: { note: '請注意保暖，並準備前往新穗高' } },
            { id: 5, type: 'transport', name: '濃飛巴士往新穗高', time: '11:40', location: '濃飛巴士站', details: { note: '在H64 新穂高溫泉下車, 票價 2200' } },
            { id: 6, type: 'attraction', name: '雪屋祭', time: '19:00', location: '新穗高溫泉中尾', details: { note: '新穗高溫泉中尾雪屋祭' } },
        ],
        '2026-02-06': [
             { id: 7, type: 'attraction', name: '新穗高纜車', time: '9:00', location: '新穗高高空纜車', details: { note: '欣賞北阿爾卑斯雪景' } },
             { id: 8, type: 'meal', name: '高山清酒廠巡禮', time: '15:00', location: '原田酒造場', details: { note: '試飲活動，注意時間不要耽誤' } },
             { id: 9, type: 'meal', name: '晚餐：味の与平', time: '18:30', location: '岐阜県高山市上三之町105', details: { note: '本店官網菜單確認' } },
        ],
        '2026-02-07': [], 
        '2026-02-08': [],
        '2026-02-09': [],
    },
    accommodations: [
        { date: '2/4', name: 'ホテルアマネク飛騨高山', address: '岐阜県高山市花里町４‐７５‐３', tel: '0577-36-2222' },
        { date: '2/5', name: 'ホテル穂高', address: '岐阜県高山市奥飛騨温泉郷新穂高温泉', tel: '0578-89-2001' },
        { date: '2/6', name: 'ホテルアマネク飛騨高山', address: '岐阜県高山市花里町４‐７５‐３', tel: '0577-36-2222' },
        { date: '2/7 ~ 2/8', name: 'ベストウェスタンプラス名古屋栄', address: '愛知県名古屋市中区栄４丁目６－１', tel: '052-262-6000' },
    ],
    shoppingList: [
        { name: 'Moflin (シルバー)', location: 'ビックカメラ名古屋駅西店', price: 39800, acquired: false },
        { name: '清酒', location: '高山老街', price: null, acquired: false },
        { name: '名古屋限定蝦餅', location: '中部國際機場', price: null, acquired: false },
    ],
    expenses: [
        { category: '交通', name: '新特麗亞套票', date: '2026-02-04', amount: 5500, method: '現金', note: '機場-高山' },
        { category: '住宿', name: 'ホテルアマネク飛騨高山 (2晚)', date: '2026-02-04', amount: 30000, method: '信用卡', note: '總住宿費的一部分' },
        { category: '餐飲', name: '午餐', date: '2026-02-04', amount: 2000, method: '現金', note: '機場輕食' },
    ],
    exchangeRate: 0.22, 
};

// 取得每日的日期清單並排序
const tripDates = Object.keys(initialTripData.dailyItineraries).sort();


// --- Vue App 主體邏輯 ---
const App = {
    setup() {
        const activeTab = ref('itinerary');
        const selectedDate = ref(tripDates[0]);
        const isModalOpen = ref(false); 

        const tripData = ref(initialTripData);
        
        // 計算當前日期的天氣資訊
        const weatherInfo = computed(() => {
            const date = selectedDate.value;
            if (date === '2026-02-04') return { tempMax: 1, tempMin: -5, condition: '雪', location: '高山/名古屋', note: '體感: -3°C' };
            if (date === '2026-02-05') return { tempMax: 0, tempMin: -6, condition: '大雪', location: '新穗高', note: '體感: -5°C' };
            if (date === '2026-02-06') return { tempMax: 2, tempMin: -4, condition: '晴朗', location: '高山', note: '體感: -2°C' };
            if (date === '2026-02-07') return { tempMax: 6, tempMin: 0, condition: '多雲', location: '名古屋', note: '體感: 2°C' };
            if (date === '2026-02-08') return { tempMax: 7, tempMin: 1, condition: '小雨', location: '名古屋', note: '體感: 3°C' };
            if (date === '2026-02-09') return { tempMax: 8, tempMin: 2, condition: '晴朗', location: '名古屋', note: '體感: 4°C' };
            return { tempMax: '?', tempMin: '?', condition: '未知', location: '未知', note: '' };
        });

        // 修正後的 dateOptions 邏輯：將 1, 2, 3 改為 02/04 格式
        const dateOptions = computed(() => {
            return tripDates.map((date, index) => {
                const dayIndex = index + 1;
                const dayOfWeekIndex = new Date(date).getDay();
                const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][dayOfWeekIndex];
                
                // 將 "2026-02-04" 轉換為 "02/04"
                const parts = date.split('-'); // ['2026', '02', '04']
                const displayDate = `${parts[1]}/${parts[2]}`;

                return {
                    day: dayIndex,
                    date: date,
                    display: displayDate, // 這裡改為日期字串
                    dayOfWeek: dayOfWeek 
                };
            });
        });

        const currentItinerary = computed(() => {
            return tripData.value.dailyItineraries[selectedDate.value] || [];
        });

        const accommodationList = computed(() => {
            return tripData.value.accommodations;
        });

        const shoppingList = computed(() => {
            return tripData.value.shoppingList;
        });

        const expenseList = computed(() => {
            return tripData.value.expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
        });

        const totalExpenseJPY = computed(() => {
            return expenseList.value.reduce((sum, item) => sum + (item.amount || 0), 0);
        });

        const totalExpenseTWD = computed(() => {
            return (totalExpenseJPY.value * tripData.value.exchangeRate).toFixed(0);
        });
        
        const selectDate = (date) => {
            selectedDate.value = date;
        };

        const selectTab = (tab) => {
            activeTab.value = tab;
        };
        
        const toggleAcquired = (item) => {
            item.acquired = !item.acquired;
        };

        const openModal = () => {
            isModalOpen.value = true;
        };

        const closeModal = () => {
            isModalOpen.value = false;
        };

        const saveItinerary = () => {
             alert("行程新增功能開發中...");
             closeModal();
        }

        return {
            activeTab,
            selectedDate,
            dateOptions,
            weatherInfo,
            currentItinerary,
            accommodationList,
            shoppingList,
            expenseList,
            totalExpenseJPY,
            totalExpenseTWD,
            isModalOpen,
            selectTab,
            selectDate,
            toggleAcquired,
            openModal,
            closeModal,
            saveItinerary,
        };
    },

    template: `
        <div class="min-h-screen bg-gray-100">
            
            <div class="relative h-[250px] w-full">
                <img src="gassho_winter_banner.jpg" alt="名古屋六日遊橫幅" class="w-full h-full object-cover">
                
                <h1 class="absolute top-8 left-4 text-white text-2xl font-bold z-10">名古屋六日遊</h1>
            </div>

            <div class="relative -mt-10 z-20 rounded-t-3xl overflow-hidden bg-gray-100 min-h-[calc(100vh-240px)]">
                
                <div class="bg-white px-4 pt-3 pb-2 shadow-sm flex w-full justify-around">
                    <button @click="selectTab('itinerary')" :class="['flex-1 p-2 flex flex-col items-center', activeTab === 'itinerary' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600']">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                        <span class="text-xs mt-1">行程</span>
                    </button>
                    <button @click="selectTab('accommodation')" :class="['flex-1 p-2 flex flex-col items-center', activeTab === 'accommodation' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600']">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m8-10v12h4L20 9l-4-2z"></path></svg>
                        <span class="text-xs mt-1">資訊</span>
                    </button>
                    <button @click="selectTab('shopping')" :class="['flex-1 p-2 flex flex-col items-center', activeTab === 'shopping' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600']">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                        <span class="text-xs mt-1">購物</span>
                    </button>
                    <button @click="selectTab('expense')" :class="['flex-1 p-2 flex flex-col items-center', activeTab === 'expense' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600']">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        <span class="text-xs mt-1">花費</span>
                    </button>
                </div>

                <div class="p-4 pb-20">
                    
                    <div v-if="activeTab === 'itinerary'" class="flex flex-col space-y-4">
                        
                        <div class="flex overflow-x-auto space-x-2 scrollbar-hide py-1"> 
                            <div v-for="option in dateOptions" :key="option.date" @click="selectDate(option.date)"
                                 :class="['flex-shrink-0 w-[50px] h-14 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 border',
                                          selectedDate === option.date ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']">
                                <span class="text-[10px]">週{{ option.dayOfWeek }}</span>
                                <span class="text-sm font-bold leading-none">{{ option.display }}</span>
                            </div>
                        </div>

                        <div v-if="weatherInfo" class="bg-gradient-to-r from-blue-400 to-blue-500 p-4 rounded-xl shadow text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-xs opacity-90">{{ selectedDate }} 天氣 ({{ weatherInfo.location }})</p>
                                    <div class="flex items-baseline mt-1">
                                        <span class="text-3xl font-bold">{{ weatherInfo.tempMax }}°</span>
                                        <span class="text-xl font-light opacity-80 mx-1">/</span>
                                        <span class="text-xl font-light opacity-80">{{ weatherInfo.tempMin }}°</span>
                                        <span class="ml-2 text-sm">{{ weatherInfo.condition }}</span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <svg v-if="weatherInfo.condition.includes('雪')" class="w-8 h-8 inline-block opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12.5a.5.5 0 11-1 0 .5.5 0 011 0zm-5 0a.5.5 0 11-1 0 .5.5 0 011 0zm-5 0a.5.5 0 11-1 0 .5.5 0 011 0zM12 21a9 9 0 100-18 9 9 0 000 18z"></path></svg>
                                    <svg v-else-if="weatherInfo.condition.includes('晴')" class="w-8 h-8 inline-block opacity-90 text-yellow-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 7.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H8.25a.75.75 0 01-.75-.75zM3 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zM7.5 16.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H8.25a.75.75 0 01-.75-.75zM12 21.75a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM16.5 16.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM21 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM16.5 7.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM12 7a5 5 0 100 10 5 5 0 000-10z"></path></svg>
                                    <p class="text-xs mt-1">{{ weatherInfo.note }}</p>
                                </div>
                            </div>
                        </div>

                        <div v-if="currentItinerary.length" class="space-y-4">
                            <template v-for="(item, index) in currentItinerary" :key="item.id">
                                <div :class="['p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start', item.type === 'flight' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800']">
                                    <div class="flex items-start space-x-3 overflow-hidden">
                                        <div class="mt-1 flex-shrink-0">
                                            <svg v-if="item.type === 'flight'" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                            <svg v-else-if="item.type === 'transport'" :class="['w-5 h-5', item.type === 'flight' ? 'text-white' : 'text-blue-500']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243m10.121-5.172a1.998 1.998 0 00-2.828 0L10 14.121m4.121-4.121a1.998 1.998 0 00-2.828 0L10 14.121m0 0l-4.243 4.243m4.243-4.243l4.243-4.243"></path></svg>
                                            <svg v-else-if="item.type === 'attraction'" class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-12a9 9 0 110 18 9 9 0 010-18z"></path></svg>
                                            <svg v-else-if="item.type === 'meal'" class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2v5l-2-2m2-3V6m0 0h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        </div>
                                        
                                        <div class="flex-1 min-w-0">
                                            <p :class="['font-bold text-base truncate', item.type === 'flight' ? 'text-white' : 'text-gray-800']">{{ item.name }}</p>
                                            <p v-if="item.location" :class="['text-xs mt-0.5 truncate', item.type === 'flight' ? 'text-blue-100' : 'text-gray-500']">{{ item.location }}</p>
                                            <p v-if="item.details && item.details.note" :class="['text-xs mt-1', item.type === 'flight' ? 'text-blue-200' : 'text-gray-400']">{{ item.details.note }}</p>
                                        </div>
                                    </div>

                                    <div :class="['text-sm font-mono flex-shrink-0 ml-2', item.type === 'flight' ? 'text-white' : 'text-gray-900 font-semibold']">
                                        {{ item.time }}
                                    </div>
                                </div>
                                
                                <div v-if="index < currentItinerary.length - 1" class="pl-6 border-l-2 border-dashed border-gray-300 ml-6 h-6"></div>
                            </template>
                        </div>

                        <p v-else class="text-center text-gray-400 py-10">今日無行程安排</p>
                    </div>

                    <div v-else-if="activeTab === 'accommodation'" class="space-y-3">
                        <div v-for="(item, index) in accommodationList" :key="index" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mb-2">{{ item.date }}</span>
                            <p class="text-lg font-bold text-gray-800">{{ item.name }}</p>
                            <div class="flex items-start mt-2 text-gray-500 text-sm">
                                <svg class="w-4 h-4 mt-0.5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243m10.121-5.172a1.998 1.998 0 00-2.828 0L10 14.121m4.121-4.121a1.998 1.998 0 00-2.828 0L10 14.121m0 0l-4.243 4.243m4.243-4.243l4.243-4.243"></path></svg>
                                <span>{{ item.address }}</span>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="activeTab === 'shopping'" class="space-y-3">
                        <div v-for="(item, index) in shoppingList" :key="index" 
                             :class="['bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer', item.acquired ? 'bg-gray-50' : '']"
                             @click="toggleAcquired(item)">
                            <div class="flex items-center space-x-3">
                                <div :class="['w-5 h-5 rounded border flex items-center justify-center', item.acquired ? 'bg-green-500 border-green-500' : 'border-gray-300']">
                                    <svg v-if="item.acquired" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <p :class="['font-medium', item.acquired ? 'text-gray-400 line-through' : 'text-gray-800']">{{ item.name }}</p>
                                    <p v-if="item.location" class="text-xs text-gray-500">{{ item.location }}</p>
                                </div>
                            </div>
                            <p v-if="item.price" class="text-sm font-bold text-gray-600">¥{{ item.price }}</p>
                        </div>
                    </div>

                    <div v-else-if="activeTab === 'expense'" class="space-y-3">
                        <div class="bg-gray-800 text-white p-5 rounded-2xl shadow-lg mb-4">
                            <p class="text-xs text-gray-400 uppercase tracking-wide">Total Expenses</p>
                            <div class="flex items-baseline mt-1">
                                <span class="text-2xl font-bold">¥</span>
                                <span class="text-4xl font-bold ml-1">{{ totalExpenseJPY.toLocaleString() }}</span>
                            </div>
                            <p class="text-sm text-gray-400 mt-1">≈ NT$ {{ totalExpenseTWD.toLocaleString() }}</p>
                        </div>

                        <div v-for="(item, index) in expenseList" :key="index" class="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                    <span class="text-xs font-bold">{{ item.category.substring(0,1) }}</span>
                                </div>
                                <div>
                                    <p class="font-bold text-gray-800 text-sm">{{ item.name }}</p>
                                    <p class="text-xs text-gray-500">{{ item.date }} • {{ item.method }}</p>
                                </div>
                            </div>
                            <p class="font-bold text-gray-800">-¥{{ item.amount.toLocaleString() }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <button @click="openModal" class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full text-white shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-transform active:scale-95 z-30">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>

            <div v-if="isModalOpen" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div @click.stop class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade">
                    <div class="p-6">
                        <h2 class="text-xl font-bold text-gray-800 mb-4">新增行程項目</h2>
                        <p class="text-gray-500 text-sm">此為示範功能，尚無法實際新增。</p>
                        <div class="mt-4 flex justify-end space-x-3">
                            <button @click="closeModal" class="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">取消</button>
                            <button @click="saveItinerary" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">儲存</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

createApp(App).mount('#app');
