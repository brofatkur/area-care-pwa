const fs = require('fs');
const path = require('path');

const areasData = [
  {
    id: 'area_parkir',
    name: 'Area Parkir',
    qr_code: 'QR_AREA_PARKIR',
    sections: [
      {
        code: 'A',
        name: 'Paving & Jalur Masuk',
        items: [
          'Paving blok bersih dari lumut & rumput liar',
          'Marking jalur masuk jelas dan rapi',
          'Tidak ada genangan air atau oli',
          'Ramp akses motor/mobil mulus tanpa retakan',
          'Cat batas jalan & polisi tidur terlihat jelas',
          'Kondisi penutup got/saluran depan rata',
          'Rambu kecepatan & arah masuk tegak & bersih',
          'Kebersihan trotoar luar depan gerbang',
          'Bebas dari puntung rokok & dedaunan kering'
        ]
      },
      {
        code: 'B',
        name: 'Area Parkir Motor',
        items: [
          'Garis marka slot parkir motor jelas',
          'Motor tersusun rapi sesuai batas garis',
          'Lantai bebas ceceran oli motor',
          'Stand helm & area penitipan tertata rapi',
          'Signage parkir khusus tamu vs staf bersih',
          'Tempat sampah area motor kosong & ada plastik',
          'Tiang pembatas kokoh tidak goyang',
          'Kerapian kabel atau pipa di dinding parkir motor',
          'Penerangan malam di atas parkir motor berfungsi'
        ]
      },
      {
        code: 'C',
        name: 'Area Parkir Mobil',
        items: [
          'Garis marka slot mobil (tamup, direksi, operasional) tegas',
          'Stopper roda mobil bersih dan terpasang kuat',
          'Bebas tetesan oli atau cairan radiator di paving',
          'Kerapian kanopi / peneduh mobil',
          'Signage tarif/aturan parkir terbaca jelas',
          'Jalur putar dan manuver mobil bebas hambatan',
          'Cermin cembung tikungan bersih dan sudut pas',
          'Penerangan area mobil terang merata'
        ]
      },
      {
        code: 'D',
        name: 'Dinding, Pagar & Plang Depan',
        items: [
          'Plang nama ASA / BOffice bersih & lampu menyala',
          'Pagar besi bebas karat & rel pintu pagar lancar',
          'Dinding luar bebas coretan dan debu tebal',
          'Kondisi cat dinding luar rapi tidak mengelupas',
          'Plafon kanopi luar bersih dari sarang laba-laba',
          'Lampu sorot fasad gedung menyala optimal',
          'Tanaman hias depan terawat & disiram',
          'Kerapian nomor bangunan & papan izin'
        ]
      },
      {
        code: 'E',
        name: 'Tempat Sampah & Pemilahan',
        items: [
          'Tong sampah pilah (Organik, Anorganik, B3) bersih luar dalam',
          'Plastik sampah terpasang rapi di dalam tong',
          'Tutup tong sampah berfungsi rapat',
          'Area sekitar tong sampah tidak bau dan tidak becek',
          'TPS sementara tertutup dan rapi',
          'Jadwal angkut sampah terpasang dan terpantau',
          'Ketersediaan sapu lidi, serokan, dan kantong cadangan',
          'Bebas dari lalat dan serangga pengganggu'
        ]
      },
      {
        code: 'F',
        name: 'Drainase & Saluran Pembuangan',
        items: [
          'Grill besi penutup drainase terpasang kokoh & bersih',
          'Saluran air lancar tidak ada endapan lumpur/sampah',
          'Tidak tercium bau menyengat dari got/drainase',
          'Pipa talang air hujan vertikal utuh tidak bocor',
          'Bak kontrol air bersih dan saringan tidak mampet',
          'Lubang resapan air / biopori berfungsi lancar',
          'Dinding saluran tidak retak atau bocor ke jalan',
          'Bebas dari jentik nyamuk dan genangan mati'
        ]
      },
      {
        code: 'G',
        name: 'Depan Gedung & Teras Luar',
        items: [
          'Keset luar depan pintu masuk bersih dan kering',
          'Lantai teras disapu dan dipel bersih mengkilap',
          'Kaca etalase luar bebas debu & bercak sidik jari',
          'Tempat payung basah tersedia dan rapi',
          'Asbak luar bersih dan pasir/air diganti',
          'Bunga/tanaman pot depan teras daunnya segar',
          'Bel pintu & intercom berfungsi normal',
          'Signage petunjuk arah masuk terbaca jelas',
          'Kamera CCTV outdoor bersih dari debu/sarang laba-laba',
          'READY TO USE: Fasad & Halaman Luar Siap Menerima Tamu'
        ]
      }
    ]
  },
  {
    id: 'area_fo_bts',
    name: 'Front Office BTS',
    qr_code: 'QR_AREA_FO_BTS',
    sections: [
      {
        code: 'A',
        name: 'Pintu Masuk & Foyer BTS',
        items: [
          'Pintu kaca otomatis/manual bersih tanpa bercak',
          'Handle pintu higienis dan kokoh',
          'Keset welcoming kering dan posisinya lurus',
          'Sensor pintu / bel sambutan berfungsi baik',
          'Suhu ruangan lobi sejuk (22-24°C)',
          'Aroma ruangan wangi dan menyegarkan',
          'Hand sanitizer di pintu masuk terisi penuh',
          'Layar informasi sambutan menyala aktif'
        ]
      },
      {
        code: 'B',
        name: 'Meja Customer Service & Kasir',
        items: [
          'Permukaan meja CS bersih dan bebas debu',
          'Komputer, keyboard, dan mouse tertata rapi',
          'Kerapian jalur kabel di bawah dan belakang meja',
          'Mesin EDC dan barcode scanner berfungsi & bersih',
          'Stempel, pulpen, dan alat tulis tersusun di organizer',
          'Papan nama petugas CS terpasang rapi',
          'Kursi petugas bersih dan hidrolik normal',
          'Laci kasir dan dokumen tertutup rapi'
        ]
      },
      {
        code: 'C',
        name: 'Area Tunggu & Kursi Tamu',
        items: [
          'Sofa / kursi tamu bebas debu dan noda',
          'Bantal kursi tersusun simetris dan rapi',
          'Meja kopi tamu bersih tanpa bekas cangkir',
          'Majalah dan brosur terbaru tersusun rapi di meja',
          'Stop kontak charging station tamu berfungsi',
          'Karpet area tunggu divakum bersih',
          'Tempat sampah kecil di samping sofa kosong & berplastik',
          'Jarak antar kursi proporsional dan leluasa'
        ]
      },
      {
        code: 'D',
        name: 'Dispenser Air & Refreshment Tamu',
        items: [
          'Bodi dispenser luar bersih mengkilap tanpa noda air',
          'Baki penampung tetesan air kosong dan kering',
          'Kran panas dan dingin berfungsi normal',
          'Galon air terisi cukup (tidak kosong)',
          'Cup dispenser terisi gelas bersih / paper cup',
          'Tempat pembuangan cup bekas bersih dan rapi',
          'Gula sachet, teh, dan kopi tamu tertata di wadah',
          'Tisu meja tamu selalu tersedia'
        ]
      },
      {
        code: 'E',
        name: 'Rak Brosur, Banner & Display',
        items: [
          'Rak brosur akrilik bersih tidak berdebu',
          'Brosur paket sewa & layanan tersusun rapi',
          'Roll banner berdiri tegak dan tidak melengkung',
          'Display merchandise / sampel produk rapi',
          'Lampu sorot rak display menyala terang',
          'Papan pengumuman/kurs/tarif terupdate',
          'Brosur usang/rusak sudah disingkirkan',
          'Akrilik QR Code pembayaran QRIS bersih & jelas'
        ]
      },
      {
        code: 'F',
        name: 'Branding BTS, BOffice & ASA Rental',
        items: [
          'Logo 3D akrilik BTS di dinding bersih mengkilap',
          'Backdrop lampu LED neon sign menyala sempurna',
          'Plakat ASA Rental dan kemitraan terpasang lurus',
          'Stiker branding kaca tidak mengelupas',
          'Frame sertifikat / piagam penghargaan bersih',
          'Tidak ada kabel signage yang menjuntai liar',
          'Warna cat dinding backdrop bersih merata',
          'Kerapian display kartu nama representatif'
        ]
      },
      {
        code: 'G',
        name: 'Lantai, Dinding & Plafon FO BTS',
        items: [
          'Lantai granit/vinil dipel bersih berkilau',
          'List plint dinding sudut bawah bebas debu',
          'Dinding tidak ada noda bercak sepatu atau kotoran',
          'Plafon gipsum bersih bebas noda rembesan AC',
          'Semua kisi-kisi AC split/kaset bersih dari jelaga debu',
          'Lampu downlight plafon menyala semua',
          'Jam dinding tepat waktu dan baterai aktif',
          'Diffuser aromaterapi menyala mengeluarkan aroma'
        ]
      },
      {
        code: 'H',
        name: 'Fasilitas Penunjang & Keamanan',
        items: [
          'APAR tabung pemadam bertekanan normal & segel utuh',
          'Petunjuk jalur evakuasi terlihat jelas',
          'CCTV sudut kasir dan lobi beroperasi normal',
          'Kotak P3K FO terisi obat dasar dan perban',
          'Kondisi alarm kebakaran dan detector asap di plafon normal',
          'Signage larangan merokok dan petunjuk emergency',
          'Akses pintu darurat bebas halangan',
          'Buku log tamu FO BTS rapi di tempatnya',
          'READY TO USE: Front Office BTS Siap Operasional'
        ]
      }
    ]
  },
  {
    id: 'area_fo_boffice',
    name: 'BOffice Front Office',
    qr_code: 'QR_AREA_FO_BOFFICE',
    sections: [
      {
        code: 'A',
        name: 'Lantai & Sirkulasi',
        items: [
          'Lantai foyer dipel bersih, harum dan tidak licin',
          'Tidak ada noda seretan sol sepatu atau kotoran tanah',
          'Sambungan nat lantai bersih dan rapi',
          'Jalur lalu lalang tamu bebas dari halangan kabel/dus',
          'List skriting dinding bersih dari debu',
          'Keset transisi antar ruangan kering dan bersih',
          'Kerapian floor drain atau penutup kabel lantai',
          'Pemberian tanda hati-hati lantai basah bila sedang dipel',
          'Tempat sampah tersembunyi kosong dan wangi',
          'Sirkulasi udara segar dan sejuk merata'
        ]
      },
      {
        code: 'B',
        name: 'Reception Desk BOffice',
        items: [
          'Meja resepsionis kayu/marmer bersih tanpa noda minyak',
          'Buku tamu / tablet digital check-in bersih & stand by',
          'Display kartu nama & pamflet BOffice tersusun elegan',
          'Telepon PABX resepsionis bersih dan kabel rapi',
          'Kabel PC, printer tiket, dan monitor terbungkus pelindung',
          'Alat tulis resepsionis lengkap di holder',
          'Kursi ergonomis resepsionis bersih dan teratur',
          'Dinding bawah meja bersih dari coretan sepatu',
          'Laci penyimpanan kunci loker tersusun tertib',
          'Area belakang meja resepsionis tidak berantakan'
        ]
      },
      {
        code: 'C',
        name: 'Kursi & Lounge Tamu',
        items: [
          'Armchair dan sofa kulit bersih tanpa debu di lipatan',
          'Meja marmer samping sofa bersih tanpa bercak cangkir',
          'Jarak sofa lapang dan nyaman untuk privasi tamu',
          'Bantal kursi tertata rapi dan bersih',
          'Karpet bulu tamu sudah disedot vakum tanpa remah',
          'Koneksi Wi-Fi tamu QR code terpasang di meja',
          'Lampu standing lobi menyala hangat (warm white)',
          'Tanaman indoor monstera/sansevieria daunnya dilap bersih',
          'Tidak ada bau rokok atau apek di area lounge',
          'Kerapian colokan charger meja lounge'
        ]
      },
      {
        code: 'D',
        name: 'Branding BOffice, BLegal & Bali Mediation',
        items: [
          'Logo stainless BOffice terpasang kuat dan berkilau',
          'Signage sub-brand BLegal bersih tanpa noda lem',
          'Papan nama Bali Mediation Center terpasang presisi',
          'Lampu sorot spotlight logo menyala tanpa kedip',
          'Dinding aksen kayu/batu alam bebas debu',
          'Plakat akreditasi dan izin resmi terpasang lurus',
          'Brosur legalitas dan mediasi tersedia rapi',
          'Banner promosi virtual office tersusun tepat',
          'Kerapian instalasi kelistrikan di balik panel branding'
        ]
      },
      {
        code: 'E',
        name: 'Kaca, Pintu & Partisi',
        items: [
          'Pintu utama kaca frameless bersih dari bekas tangan',
          'Kunci digital / magnetic door lock berfungsi lancar',
          'Engsel pintu tidak berdecit dan swing normal',
          'Stiker sandblast privasi kaca rapi tanpa gelembung',
          'Jendela kaca samping luar bersih dan jernih',
          'Kusen aluminium bersih dari debu',
          'Gorden / roller blind bersih dan tarikan lancar',
          'Gagang pintu stainless dipoles higienis',
          'Kamera bel pintu video bersih dan aktif',
          'READY TO USE: Front Office BOffice Prima Siap Sambut Klien'
        ]
      }
    ]
  },
  {
    id: 'area_coworking',
    name: 'BOffice Coworking',
    qr_code: 'QR_AREA_COWORKING',
    sections: [
      {
        code: 'F',
        name: 'Meja Kerja & Workstation',
        items: [
          'Meja sharing & dedicated desk bersih tanpa debu',
          'Permukaan meja bebas noda kopi, pulpen, atau tip-ex',
          'Kotak kabel colokan di atas meja bersih dan tertutup rapat',
          'Semua soket listrik meja menyala normal',
          'Port USB / Type-C charger meja berfungsi',
          'Nomor meja terpasang rapi dan tidak pudar',
          'Sekat pembatas meja bersih dan kokoh',
          'Tempat sampah mini di bawah meja kosong & berplastik',
          'Tata letak meja lurus sesuai denah lantai',
          'Bebas dari sisa makanan atau sampah pengguna sebelumnya'
        ]
      },
      {
        code: 'G',
        name: 'Kursi Kerja Ergonomis',
        items: [
          'Semua kursi kerja diselaraskan menghadap meja',
          'Jaring/busa sandaran kursi bersih dari noda dan debu',
          'Ketinggian hidrolik kursi berfungsi lancar',
          'Roda kursi berputar mulus tanpa kotoran rambut terlilit',
          'Armrest kursi kokoh tidak goyang',
          'Kursi cadangan tersusun rapi di area penyimpanan',
          'Bebas dari bau tidak sedap pada bantalan kursi',
          'Jumlah kursi sesuai kapasitas ruangan coworking',
          'Kerapian posisi kursi setelah sesi kerja selesai',
          'Pengecekan baut dan kestabilan seluruh kursi'
        ]
      },
      {
        code: 'H',
        name: 'Lantai, Dinding & Akustik',
        items: [
          'Karpet tile coworking divakum bersih tanpa debu',
          'Lantai vinyl area koridor dipel bersih mengkilap',
          'Dinding panel akustik peredam suara rapi & bersih',
          'Whiteboard/kaca tulis bersih dari bekas spidol permanen',
          'Spidol whiteboard terisi tinta dan penghapus bersih',
          'Kerapian kabel LAN dan router Wi-Fi access point',
          'Signage etika ketenangan (Quiet Zone) terbaca jelas',
          'Suhu AC sentral sejuk stabil (22°C - 24°C)',
          'Diffuser aromaterapi ruangan menyala segar',
          'Bebas dari suara bising getaran mesin/pipa'
        ]
      },
      {
        code: 'I',
        name: 'Plafon, Pencahayaan & Storage',
        items: [
          'Lampu linier gantung menyala terang dan seimbang',
          'Plafon tidak ada sarang laba-laba atau noda bocor',
          'Loker member bersih luar dalam dan kunci terpasang',
          'Area phone booth kedap suara bersih dan siap pakai',
          'Pintu phone booth menutup rapat',
          'Rak buku dan majalah sharing coworking tersusun rapi',
          'Kamera CCTV coworking bersih dari debu',
          'Tempat pemilahan sampah utama coworking teratur',
          'READY TO USE: Coworking Space Siap Dipakai Member'
        ]
      }
    ]
  },
  {
    id: 'area_coffee_station',
    name: 'Coffee & Tea Station BOffice',
    qr_code: 'QR_AREA_COFFEE_STATION',
    sections: [
      {
        code: 'J',
        name: 'Pantry, Mesin Kopi & Replenishment',
        items: [
          'Mesin kopi espresso bersih dari ampas dan kerak susu',
          'Baki tetesan mesin kopi dikosongkan dan dicuci bersih',
          'Ketel pemanas air listrik (kettle) bebas kerak air kapur',
          'Permukaan meja bar pantry kering dan bersih mengkilap',
          'Bak cuci piring (sink) stainless bersih tanpa sisa makanan',
          'Spons cuci piring bersih dan sabun cuci piring tersedia',
          'Lap microfiber / kitchen towel kering dan bersih',
          'Kulkas pantry bersih, tidak bau, dan tidak ada bunga es',
          'Microwave bersih luar dalam bebas percikan makanan',
          'Tempat sampah basah pantry tertutup rapat & tidak berbau',
          'Rak pengering piring tersusun rapi',
          'Kran air mengalir deras dan saringan sink tidak mampet',
          'Lantai dapur pantry dipel bersih dan tidak licin',
          'Kerapian kabel peralatan listrik dapur',
          'Bebas dari semut, kecoa, dan lalat buah',
          'Tutup toples bahan baku tertutup rapat higienis',
          'Signage jaga kebersihan pantry terpasang jelas',
          'STOK: Kopi biji / bubuk (Cukup / Menipis / Habis)',
          'STOK: Teh celup varian (Cukup / Menipis / Habis)',
          'STOK: Gula pasir & gula diet (Cukup / Menipis / Habis)',
          'STOK: Krimer nabati sachet/bubuk (Cukup / Menipis / Habis)',
          'STOK: Tisu napkin / tisu makan (Cukup / Menipis / Habis)',
          'STOK: Sabun cuci tangan & piring (Cukup / Menipis / Habis)',
          'STOK: Gelas kaca & cangkir bersih (Cukup / Menipis / Habis)',
          'READY TO USE: Coffee & Tea Station Bersih & Lengkap'
        ]
      }
    ]
  },
  {
    id: 'area_shower',
    name: 'Shower Room',
    qr_code: 'QR_AREA_SHOWER',
    sections: [
      {
        code: 'A',
        name: 'Area Bilas & Shower Kering/Basah',
        items: [
          'Status VACANT terpasang di pintu luar shower',
          'Handle pintu shower kokoh dan kunci grendel lancar',
          'Kaca pembatas shower cubicle bersih tanpa noda sabun/kerak air',
          'Kran mixer shower air panas dan dingin berfungsi lancar',
          'Kepala shower (head & hand shower) lubangnya lancar tidak tersumbat kerak kapur',
          'Lantai shower basah disikat bersih tidak berlendir/licin',
          'Floor drain saringan shower bersih bebas dari rontokan rambut',
          'Dinding keramik shower digosok bersih bebas jamur dan noda kuning',
          'Tempat sabun & sampo dinding terisi penuh dan botol bersih',
          'Gantungan baju / handuk kering kokoh terpasang',
          'Keset bath mat kering dan lembut di depan pintu shower',
          'Cermin shower room jernih tidak berembun atau bercak',
          'Wastafel shower bersih dan kran air deras mengalir',
          'Sabun cuci tangan cair di wastafel terisi penuh',
          'Tempat sampah shower tertutup berplastik hitam & kosong',
          'Kipas exhaust shower room menyala lancar menyedot uap',
          'Lampu tahan air shower room menyala terang benderang',
          'Plafon shower room bersih tidak ada jamur lembab',
          'Hair dryer di area kering berfungsi normal dan kabel rapi',
          'Bangku ganti baju kayu/fiber kering dan bersih',
          'Stop kontak area kering tertutup cover pelindung air',
          'Kotak tisu wajah di meja wastafel terisi',
          'Aroma ruangan shower wangi segar bebas bau apek',
          'Tidak ada tetesan bocor dari pipa atau sambungan kran',
          'Sirkulasi udara ruangan shower segar dan tidak pengap',
          'Kebersihan ventilasi atas shower room',
          'Sikat pembersih lantai dan squeegee tersimpan di holder rapi',
          'Dinding partisi shower tidak retak atau lapuk',
          'Kerapian silikon seal kaca shower tidak berjamur hitam',
          'Kondisi sandal shower (jika ada) bersih dan kering',
          'Timbangan badan digital bersih dan baterai menyala',
          'Papan tata tertib penggunaan shower room terbaca jelas',
          'Kerapian gantungan perlengkapan kebersihan shower',
          'Pintu masuk shower menutup rapat dan tidak seret',
          'Bebas dari kecoa, kelabang, atau serangga kamar mandi',
          'Air shower jernih, tidak berbau kaporit pekat atau karat',
          'Tekanan semprotan air shower stabil',
          'Penyerap lembab (dehumidifier sachet) terpasang rapi',
          'Pembersihan ceceran air di area ganti baju segera diseka',
          'Kondisi keset karet anti-slip kokoh menempel lantai',
          'SHOWER ROOM READY TO USE'
        ]
      }
    ]
  },
  {
    id: 'area_toilet',
    name: 'Toilet Room',
    qr_code: 'QR_AREA_TOILET',
    sections: [
      {
        code: 'A',
        name: 'Kebersihan Kloset, Urinoir & Sanitasi',
        items: [
          'Kloset duduk disikat bersih putih mengkilap tanpa kerak urin',
          'Dudukan kloset (seat cover) higienis, kering dan kokoh',
          'Tombol dual-flush kloset berfungsi sempurna dan lancar',
          'Jet spray bidet semprotan air kencang dan tidak bocor menetes',
          'Urinoir pria bersih, flush sensor otomatis menyala normal',
          'Saringan urinoir dan kamper aromaterapi wangi terpasang',
          'Kertas toilet roll (jumbo roll) terpasang cukup & ada cadangan',
          'Wastafel toilet bersih mengkilap tanpa noda pasta/sabun',
          'Kran wastafel otomatis/manual berfungsi deras',
          'Dispenser sabun cuci tangan cair terisi penuh dan higienis',
          'Hand dryer otomatis menyala hangat dan kencang',
          'Dispenser tisu lap tangan terisi penuh',
          'Cermin wastafel besar bersih jernih tanpa noda cipratan air',
          'Meja counter granit wastafel kering dilap',
          'Tempat sampah pedal toilet wanita higienis & kantong terpasang',
          'Tempat sampah utama toilet tertutup rapat dan kosong',
          'Lantai toilet disikat bersih, wangi, kering dan tidak licin',
          'Nat keramik lantai toilet bersih dari lumut hitam',
          'Dinding keramik toilet bersih bebas bercak cipratan',
          'Pintu bilik toilet menutup rapat, grendel kunci berfungsi lancar',
          'Gantungan tas/jaket di balik pintu toilet terpasang kuat',
          'Exhaust fan toilet menyala nonstop bebas debu tebal',
          'Lampu toilet menyala terang seluruh sudut bilik',
          'Plafon toilet bersih dari sarang laba-laba dan rembesan air',
          'Automatic air freshener aerosol menyemprot teratur wangi segar',
          'Tidak tercium bau pesing atau bau saluran pipa septic tank',
          'Floor drain toilet tidak tersumbat dan berbau',
          'Sikat pembersih kloset ditaruh rapi di wadah tertutup',
          'Cairan pembersih dan desinfektan tersimpan di lemari tertutup',
          'Papan peringatan lantai basah (wet floor sign) tersedia',
          'Signage toilet pria & wanita di luar pintu bersih dan jelas',
          'Kerapian pipa saluran air di bawah wastafel tanpa kebocoran',
          'Bebas dari jentik nyamuk dan serangga kecil',
          'Kunci master pintu bilik tersimpan aman untuk darurat',
          'Kondisi keset di depan pintu masuk toilet kering bersih',
          'TOILET ROOM READY TO USE'
        ]
      }
    ]
  }
];

// Let's verify item counts
let total = 0;
areasData.forEach(a => {
  let areaTotal = 0;
  a.sections.forEach(s => {
    areaTotal += s.items.length;
  });
  console.log(`Area: ${a.name} -> ${a.sections.length} sections, ${areaTotal} items`);
  total += areaTotal;
});
console.log(`Total items: ${total}`);

// Convert to full ChecklistItem objects
const masterAreas = areasData.map(area => {
  return {
    id: area.id,
    name: area.name,
    qr_code: area.qr_code,
    total_items: area.sections.reduce((acc, s) => acc + s.items.length, 0),
    sections: area.sections.map(section => {
      return {
        id: `${area.id}_sec_${section.code.toLowerCase()}`,
        code: section.code,
        name: section.name,
        items: section.items.map((itemText, idx) => {
          const itemId = `${area.id}_sec_${section.code.toLowerCase()}_item_${idx + 1}`;
          const isKey = itemText.toUpperCase().includes('READY TO USE') || itemText.toUpperCase().includes('VACANT');
          const isSupply = itemText.startsWith('STOK:');
          // Infrequently changing items (like plang, jam dinding, plafon, marka parkir, lampu sorot) checked at 07.00 only
          const isLowFreq = itemText.toLowerCase().includes('marking') ||
            itemText.toLowerCase().includes('jam dinding') ||
            itemText.toLowerCase().includes('plang') ||
            itemText.toLowerCase().includes('plafon') ||
            itemText.toLowerCase().includes('kanopi') ||
            itemText.toLowerCase().includes('tanaman') ||
            itemText.toLowerCase().includes('apar') ||
            itemText.toLowerCase().includes('cctv') ||
            itemText.toLowerCase().includes('nomor') ||
            itemText.toLowerCase().includes('pintu pagar');

          return {
            id: itemId,
            code: `${section.code}.${idx + 1}`,
            text: itemText,
            frequency: isLowFreq ? 'daily_0700' : 'all_checkpoints',
            weight: isKey ? 2 : 1,
            is_key_item: isKey,
            require_photo: isKey || isSupply,
            is_supply: isSupply
          };
        })
      };
    })
  };
});

const tsContent = `// Auto-generated master checklist data (7 areas, 27 sections, 315 items)
import { Area } from '../types';

export const MASTER_AREAS: Area[] = ${JSON.stringify(masterAreas, null, 2)};

export const CHECKPOINT_SLOTS = [
  { id: '07.00', label: '07.00', time: '07:00 WITA', name: 'Shift Pagi (Pemeriksaan Lengkap)', isFullCheck: true },
  { id: '10.00', label: '10.00', time: '10:00 WITA', name: 'Checkpoint Menjelang Siang', isFullCheck: false },
  { id: '13.00', label: '13.00', time: '13:00 WITA', name: 'Checkpoint Siang (Pasca Istirahat)', isFullCheck: false },
  { id: '15.30', label: '15.30', time: '15:30 WITA', name: 'Checkpoint Sore (Jelang Akhir Shift)', isFullCheck: false }
] as const;

export const INITIAL_SUPPLIES = [
  { id: 'sup_kopi', name: 'Kopi Biji / Bubuk Espresso', area_id: 'area_coffee_station', area_name: 'Coffee & Tea Station BOffice', status: 'Cukup', last_updated: '2026-09-29 07:00', updated_by: 'Hendi' },
  { id: 'sup_teh', name: 'Teh Celup Varian', area_id: 'area_coffee_station', area_name: 'Coffee & Tea Station BOffice', status: 'Cukup', last_updated: '2026-09-29 07:00', updated_by: 'Hendi' },
  { id: 'sup_gula', name: 'Gula Pasir & Diet Sachet', area_id: 'area_coffee_station', area_name: 'Coffee & Tea Station BOffice', status: 'Menipis', last_updated: '2026-09-29 07:00', updated_by: 'Hendi' },
  { id: 'sup_krimer', name: 'Krimer Nabati Sachet', area_id: 'area_coffee_station', area_name: 'Coffee & Tea Station BOffice', status: 'Cukup', last_updated: '2026-09-29 07:00', updated_by: 'Hendi' },
  { id: 'sup_tisu_napkin', name: 'Tisu Napkin Pantry', area_id: 'area_coffee_station', area_name: 'Coffee & Tea Station BOffice', status: 'Menipis', last_updated: '2026-09-29 07:00', updated_by: 'Hendi' },
  { id: 'sup_sabun_pantry', name: 'Sabun Cuci Tangan & Piring', area_id: 'area_coffee_station', area_name: 'Coffee & Tea Station BOffice', status: 'Cukup', last_updated: '2026-09-29 07:00', updated_by: 'Hendi' },
  { id: 'sup_gelas', name: 'Gelas Bersih & Cangkir', area_id: 'area_coffee_station', area_name: 'Coffee & Tea Station BOffice', status: 'Cukup', last_updated: '2026-09-29 07:00', updated_by: 'Hendi' },
  { id: 'sup_toilet_paper', name: 'Jumbo Roll Toilet Paper', area_id: 'area_toilet', area_name: 'Toilet Room', status: 'Menipis', last_updated: '2026-09-29 07:00', updated_by: 'Hendi' },
  { id: 'sup_sabun_toilet', name: 'Sabun Cuci Tangan Cair Toilet', area_id: 'area_toilet', area_name: 'Toilet Room', status: 'Cukup', last_updated: '2026-09-29 07:00', updated_by: 'Hendi' },
  { id: 'sup_shower_gel', name: 'Sabun & Sampo Shower Room', area_id: 'area_shower', area_name: 'Shower Room', status: 'Cukup', last_updated: '2026-09-29 07:00', updated_by: 'Hendi' }
];
`;

fs.writeFileSync(path.resolve(__dirname, '../src/data/checklistMaster.ts'), tsContent);
console.log('Successfully wrote src/data/checklistMaster.ts');
