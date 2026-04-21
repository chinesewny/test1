/* ════════════════════════════════════════════
   course-manager.jsx — CourseManager (Admin เมนู 1)
   ════════════════════════════════════════════ */

const { useState: useStateCM, useEffect: useEffectCM } = React;

/* ══════════════════════════════════════════
   1. COURSE MANAGER — จัดการรายวิชา
══════════════════════════════════════════ */
window.CourseManager = () => {
    const GRADE_LEVELS = ['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6','ป.1','ป.2','ป.3','ป.4','ป.5','ป.6','อื่นๆ'];
    const emptyForm = {
        code:'', name:'', credits:'1.5', year:'2569', term:'1', gradeLevel:'ม.6',
        continuous:50, midterm:20, final:30,
        continuousItems:[ { label:'คะแนนเก็บ', score:50 } ],
        classrooms: []
    };

    const [courses,      setCourses]      = useStateCM([]);
    const [showForm,     setShowForm]     = useStateCM(false);
    const [saving,       setSaving]       = useStateCM(false);
    const [editId,       setEditId]       = useStateCM(null);
    const [expandedId,   setExpandedId]   = useStateCM(null);
    const [form,         setForm]         = useStateCM(emptyForm);
    const [classInput,   setClassInput]   = useStateCM('');

    useEffectCM(() => {
        const unsub = db.collection('courses').onSnapshot(
            snap => setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            ()   => setCourses([])
        );
        return () => unsub();
    }, []);

    const openAdd  = ()  => { setForm(emptyForm); setEditId(null); setShowForm(true); window.scrollTo({top:0,behavior:'smooth'}); };
    const openEdit = (c) => {
        setForm({
            ...emptyForm, ...c,
            continuousItems: (c.continuousItems && c.continuousItems.length > 0)
                ? c.continuousItems
                : [{ label:'คะแนนเก็บ', score: c.continuous ?? 50 }],
            classrooms: c.classrooms || []
        });
        setClassInput('');
        setEditId(c.id);
        setShowForm(true);
        window.scrollTo({top:0,behavior:'smooth'});
    };

    /* ห้องเรียน helpers */
    const addClassroom = () => {
        const val = classInput.trim();
        if (!val) return;
        if (form.classrooms.includes(val)) { setClassInput(''); return; }
        setForm(p=>({...p, classrooms:[...p.classrooms, val]}));
        setClassInput('');
    };
    const removeClassroom = (cls) => setForm(p=>({...p, classrooms:p.classrooms.filter(c=>c!==cls)}));

    /* คะแนนเก็บย่อย helpers */
    const itemsSum   = () => form.continuousItems.reduce((s,i)=>s+Number(i.score||0),0);
    const addItem    = () => setForm(p=>({...p, continuousItems:[...p.continuousItems,{label:'',score:0}]}));
    const removeItem = (idx) => setForm(p=>({...p, continuousItems:p.continuousItems.filter((_,i)=>i!==idx)}));
    const updateItem = (idx, key, val) => setForm(p=>({
        ...p,
        continuousItems: p.continuousItems.map((it,i)=> i===idx ? {...it,[key]:val} : it)
    }));

    const handleSave = async (e) => {
        e.preventDefault();
        const total = Number(form.continuous)+Number(form.midterm)+Number(form.final);
        if (total !== 100) { alert('สัดส่วนคะแนนหลักรวมต้องเท่ากับ 100'); return; }
        if (itemsSum() !== Number(form.continuous)) {
            alert(`คะแนนเก็บย่อยรวม ${itemsSum()}% ต้องเท่ากับคะแนนเก็บ ${form.continuous}%`);
            return;
        }
        setSaving(true);
        const data = {
            ...form,
            credits: Number(form.credits),
            continuous: Number(form.continuous),
            midterm: Number(form.midterm),
            final: Number(form.final),
            continuousItems: form.continuousItems.map(it=>({label:it.label, score:Number(it.score)})),
            classrooms: form.classrooms || []
        };
        try {
            if (editId) await db.collection('courses').doc(editId).update(data);
            else        await db.collection('courses').add(data);
            setShowForm(false);
        } catch(err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
        setSaving(false);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`ลบรายวิชา "${name}"?`)) return;
        await db.collection('courses').doc(id).delete();
    };

    const mainTotal = Number(form.continuous)+Number(form.midterm)+Number(form.final);
    const subTotal  = itemsSum();

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Icon name="fa-book-open" className="text-red-700" size={24}/> จัดการรายวิชา
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">กำหนดโครงสร้างคะแนนและรายวิชา</p>
                </div>
                <button onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition-colors">
                    <Icon name="fa-plus" size={14}/> เพิ่มรายวิชา
                </button>
            </div>

            {/* ── Form ── */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-lg mb-5 text-gray-800">{editId ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'}</h3>
                    <form onSubmit={handleSave} className="space-y-5">

                        {/* แถวที่ 1: รหัส + หน่วยกิต */}
                        <div className="grid grid-cols-2 gap-4">
                            <F label="รหัสวิชา *">
                                <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                                    placeholder="เช่น จ33201" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))}/>
                            </F>
                            <F label="หน่วยกิต">
                                <input type="number" step="0.5" min="0.5" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                                    value={form.credits} onChange={e=>setForm(p=>({...p,credits:e.target.value}))}/>
                            </F>
                        </div>

                        {/* ชื่อวิชา */}
                        <F label="ชื่อวิชา *">
                            <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                                placeholder="เช่น ภาษาจีน 5" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
                        </F>

                        {/* แถวที่ 3: ระดับชั้น + ปีการศึกษา + ภาคเรียน */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <F label="ระดับชั้น">
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                                    value={form.gradeLevel} onChange={e=>setForm(p=>({...p,gradeLevel:e.target.value}))}>
                                    {GRADE_LEVELS.map(g=><option key={g} value={g}>{g}</option>)}
                                </select>
                            </F>
                            <F label="ปีการศึกษา">
                                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                                    value={form.year} onChange={e=>setForm(p=>({...p,year:e.target.value}))}/>
                            </F>
                            <F label="ภาคเรียน">
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                                    value={form.term} onChange={e=>setForm(p=>({...p,term:e.target.value}))}>
                                    <option value="1">ภาคเรียนที่ 1</option>
                                    <option value="2">ภาคเรียนที่ 2</option>
                                </select>
                            </F>
                        </div>

                        {/* ── ห้องเรียนที่เรียนรายวิชานี้ ── */}
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
                            <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                                <Icon name="fa-door-open" size={14}/> ห้องเรียนที่เรียนรายวิชานี้
                                <span className="font-normal text-green-600 text-xs">(พิมพ์แล้วกด Enter หรือกด + เพิ่ม)</span>
                            </p>
                            <div className="flex gap-2">
                                <input
                                    value={classInput}
                                    onChange={e=>setClassInput(e.target.value)}
                                    onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addClassroom(); }}}
                                    placeholder="เช่น ม.6/2, ม.5/1 ..."
                                    list="course-class-suggestions"
                                    className="flex-1 px-3 py-2 border border-green-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-300 bg-white"/>
                                <datalist id="course-class-suggestions">
                                    {['ม.4/1','ม.4/2','ม.4/3','ม.4/4','ม.4/5',
                                      'ม.5/1','ม.5/2','ม.5/3','ม.5/4','ม.5/5',
                                      'ม.6/1','ม.6/2','ม.6/3','ม.6/4','ม.6/5',
                                      'ม.1/1','ม.2/1','ม.3/1'].map(c=><option key={c} value={c}/>)}
                                </datalist>
                                <button type="button" onClick={addClassroom}
                                    className="px-4 py-2 bg-green-700 text-white text-sm font-bold rounded-lg hover:bg-green-800 flex items-center gap-1">
                                    <Icon name="fa-plus" size={12}/> เพิ่ม
                                </button>
                            </div>
                            {form.classrooms.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {form.classrooms.map(cls => (
                                        <span key={cls} className="flex items-center gap-1.5 bg-green-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            <Icon name="fa-chalkboard" size={10}/>{cls}
                                            <button type="button" onClick={()=>removeClassroom(cls)}
                                                className="ml-0.5 hover:text-red-200 leading-none">×</button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-green-600 italic">ยังไม่มีห้องเรียน — เพิ่มได้ตามต้องการ</p>
                            )}
                        </div>

                        {/* โครงสร้างคะแนนหลัก */}
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                            <p className="text-sm font-bold text-gray-700">โครงสร้างคะแนนหลัก (รวม = 100%)</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[['continuous','คะแนนเก็บ'],['midterm','กลางภาค'],['final','ปลายภาค']].map(([key,lbl]) => (
                                    <F key={key} label={`${lbl} (%)`}>
                                        <input type="number" min="0" max="100" required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 text-center font-bold"
                                            value={form[key]} onChange={e=>{
                                                const val = e.target.value;
                                                setForm(p=>{
                                                    const updated = {...p,[key]:val};
                                                    if (key==='continuous') {
                                                        /* sync item เดียวถ้ายังเป็น default */
                                                        if (p.continuousItems.length===1 && p.continuousItems[0].label==='คะแนนเก็บ') {
                                                            updated.continuousItems=[{label:'คะแนนเก็บ',score:Number(val)||0}];
                                                        }
                                                    }
                                                    return updated;
                                                });
                                            }}/>
                                    </F>
                                ))}
                            </div>
                            <p className={`text-sm font-bold ${mainTotal===100?'text-green-600':'text-red-500'}`}>
                                รวม: {mainTotal}% {mainTotal===100?'✓':'(ต้องรวมเป็น 100)'}
                            </p>

                            {/* คะแนนเก็บย่อย */}
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-bold text-gray-700">
                                        รายละเอียดคะแนนเก็บ
                                        <span className="ml-2 text-xs font-normal text-gray-400">(รวมต้องเท่ากับ {form.continuous}%)</span>
                                    </p>
                                    <button type="button" onClick={addItem}
                                        className="flex items-center gap-1 text-xs text-red-700 hover:text-red-900 font-medium border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">
                                        <Icon name="fa-plus" size={11}/> เพิ่มรายการ
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {form.continuousItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 w-5 text-center">{idx+1}.</span>
                                            <input
                                                placeholder="ชื่อรายการ เช่น การบ้าน, ทดสอบย่อย"
                                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-300"
                                                value={item.label}
                                                onChange={e=>updateItem(idx,'label',e.target.value)}/>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <input type="number" min="0" max="100"
                                                    className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-red-300 font-bold"
                                                    value={item.score}
                                                    onChange={e=>updateItem(idx,'score',e.target.value)}/>
                                                <span className="text-xs text-gray-400">%</span>
                                            </div>
                                            {form.continuousItems.length > 1 && (
                                                <button type="button" onClick={()=>removeItem(idx)}
                                                    className="text-red-400 hover:text-red-600 p-1">
                                                    <Icon name="fa-times" size={12}/>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className={`text-sm mt-2 font-bold ${subTotal===Number(form.continuous)?'text-green-600':'text-orange-500'}`}>
                                    รวมย่อย: {subTotal}% {subTotal===Number(form.continuous)?'✓':`(ยังขาด ${Number(form.continuous)-subTotal}%)`}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={()=>setShowForm(false)}
                                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold">ยกเลิก</button>
                            <button type="submit" disabled={saving}
                                className="flex-1 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold disabled:opacity-70 flex items-center justify-center gap-2">
                                {saving ? <><Icon name="fa-spinner fa-spin" size={14}/> บันทึก...</> : <><Icon name="fa-save" size={14}/> บันทึก</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── List ── */}
            <div className="grid gap-4">
                {courses.length === 0 ? (
                    <div className="bg-white p-10 rounded-xl text-center text-gray-400 border border-gray-200">
                        <Icon name="fa-book-open" size={40} className="mb-3 block mx-auto opacity-40"/>
                        ยังไม่มีรายวิชา กดปุ่ม "เพิ่มรายวิชา" เพื่อเริ่มต้น
                    </div>
                ) : courses.map(c => {
                    const isExpanded = expandedId === c.id;
                    const items = c.continuousItems || [];
                    return (
                        <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-5 flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">{c.code}</span>
                                        {c.gradeLevel && <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">{c.gradeLevel}</span>}
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">ปี {c.year} / เทอม {c.term}</span>
                                        <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded">{c.credits} หน่วยกิต</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">{c.name}</h3>

                                    {/* แถบโครงสร้างคะแนน */}
                                    <div className="mt-3 space-y-1">
                                        <div className="flex gap-1 h-4 rounded-full overflow-hidden text-xs">
                                            <div className="bg-orange-400 flex items-center justify-center text-white font-bold" style={{width:`${c.continuous??50}%`}}>
                                                {(c.continuous??50)>=15 ? `เก็บ ${c.continuous??50}%` : ''}
                                            </div>
                                            <div className="bg-blue-400 flex items-center justify-center text-white font-bold" style={{width:`${c.midterm??20}%`}}>
                                                {(c.midterm??20)>=15 ? `กลาง ${c.midterm??20}%` : ''}
                                            </div>
                                            <div className="bg-red-400 flex items-center justify-center text-white font-bold" style={{width:`${c.final??30}%`}}>
                                                {(c.final??30)>=15 ? `ปลาย ${c.final??30}%` : ''}
                                            </div>
                                        </div>
                                        <div className="flex gap-4 text-xs text-gray-500">
                                            <span><span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1"></span>เก็บ {c.continuous??50}%</span>
                                            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1"></span>กลางภาค {c.midterm??20}%</span>
                                            <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1"></span>ปลายภาค {c.final??30}%</span>
                                        </div>
                                    </div>

                                    {/* ห้องเรียน */}
                                    {c.classrooms && c.classrooms.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {c.classrooms.map(cls => (
                                                <span key={cls} className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Icon name="fa-chalkboard" size={9}/>{cls}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {items.length > 0 && (
                                        <button type="button" onClick={()=>setExpandedId(isExpanded?null:c.id)}
                                            className="mt-2 text-xs text-red-600 hover:underline flex items-center gap-1">
                                            <Icon name={isExpanded?'fa-chevron-up':'fa-chevron-down'} size={10}/>
                                            {isExpanded ? 'ซ่อนรายละเอียดคะแนนเก็บ' : `ดูรายละเอียดคะแนนเก็บ (${items.length} รายการ)`}
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2 ml-4 shrink-0">
                                    <button onClick={()=>openEdit(c)}
                                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                                        <Icon name="fa-edit" size={14}/>
                                    </button>
                                    <button onClick={()=>handleDelete(c.id, c.name)}
                                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                                        <Icon name="fa-trash" size={14}/>
                                    </button>
                                </div>
                            </div>

                            {/* คะแนนเก็บย่อย (ขยาย) */}
                            {isExpanded && items.length > 0 && (
                                <div className="px-5 pb-4 border-t border-gray-100 bg-orange-50">
                                    <p className="text-xs font-bold text-orange-700 mt-3 mb-2">รายละเอียดคะแนนเก็บ</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {items.map((it, i) => (
                                            <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-orange-100">
                                                <span className="text-sm text-gray-700">{it.label || `รายการ ${i+1}`}</span>
                                                <span className="text-sm font-bold text-orange-600">{it.score}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
