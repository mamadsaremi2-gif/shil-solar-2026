
const fs = require("fs");

const path = require("path");



const titleMap = {

  "ProjectPath.jsx": "مسیر پروژه",

  "ProjectInfo.jsx": "اطلاعات پروژه",

  "Environment.jsx": "شرایط محیطی",

  "CalculationMethod.jsx": "روش طراحی",

  "CalculationInputs.jsx": "ورودی مصرف", 

  "SystemSettings.jsx": "تنظیمات", 

  "EmergencySystemSettings.jsx": "انرژی اضطراری",

  "UtilitySystemSettings.jsx": "جریان و شبکه",

  "SummaryPage.jsx": "چکیده طراحی",

  "RunCalculation.jsx": "اجرای محاسبه", 

  "FinalReport.jsx": "گزارش نهایی",

  "UnderDevelopment.jsx": "در حال توسعه"

};



const roots = ["src/pages/project", "src/pages/project"].filter(fs.existsSync); 



function patchPage(file, title){

  let code = fs.readFileSync(file, "utf8");

  const old = code;



  // title="..."

  code = code.replace(

    /(<ShilPageShell\b[^>]*\btitle\s*=\s*)["'][^"']*["']/g,

    `$1"${title}"`

  );



  // title={...}

  code = code.replace(

    /(<ShilPageShell\b[^>]*\btitle\s*=\s*)\{[^}]*\}/g,

    `$1"${title}"`

  );



  // اگر title نداشت، اضافه کن

  code = code.replace(

    /<ShilPageShell\b(?![^>]*\btitle\s*=)([^>]*)>/g,

    `<ShilPageShell title="${title}"$1>`

  );



  // بعضی صفحات ممکن است headerTitle/pageTitle داشته باشند

  code = code.replace(/(headerTitle\s*=\s*)["'][^"']*["']/g, `$1"${title}"`);

  code = code.replace(/(pageTitle\s*=\s*)["'][^"']*["']/g, `$1"${title}"`);



  if(code !== old){

    fs.copyFileSync(file, file + ".header-title-bak");

    fs.writeFileSync(file, code, "utf8");

    console.log("✅ title fixed:", file, "=>", title);

  }

}



for(const root of roots){

  for(const [name,title] of Object.entries(titleMap)){

    const file = path.join(root, name);

    if(fs.existsSync(file)) patchPage(file,title);

  }

}



fs.rmSync("node_modules/.vite",{recursive:true,force:true});

fs.rmSync("dist",{recursive:true,force:true});

fs.rmSync("build",{recursive:true,force:true});



console.log("✅ Header capsule titles updated");

