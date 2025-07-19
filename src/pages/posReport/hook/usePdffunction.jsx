 // Per Employee PDF Creation Function 
 // currently this is not using

 const generateperEmployeeWiseReportPDF = (data) => {
    if (!data || !data.length) return;
  
    // Group by invoiceid
    const groupedData = data.reduce((acc, item) => {
      const key = item.invoiceid;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  
    const content = [];
  
    Object.values(groupedData).forEach((invoiceItems, idx) => {
      const first = invoiceItems[0]; // Take header info from first entry
      const menuRows = invoiceItems.map((item, i) => ([
        { text: `${i + 1}`, fontSize: 7 },
        { text: item.menuname || '-', fontSize: 7 },
        { text: item.menuqty || '0', alignment: 'center', fontSize: 7 },
        { text: item.menuamount.toFixed(2), alignment: 'right', fontSize: 7 }
      ]));
  
      const totalAmount = first.totalamount?.toLocaleString('en-QA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
      const deliveryCharge = first.deliverycharge?.toLocaleString('en-QA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
      const netAmount = first.netamount?.toLocaleString('en-QA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
  
      content.push(
        { text: first.outletname || 'Outlet', alignment: 'center', bold: true, fontSize: 9 },
        { text: 'proc-shw reg adres', alignment: 'center', fontSize: 7 },
        {
          columns: [
            { text: 'Tel : ', fontSize: 7 },
            { text: 'Fax : ', alignment: 'right', fontSize: 7 }
          ]
        },
        {
          columns: [
            { text: `Date : ${first.invdate.split(' ')[0]}`, fontSize: 7 },
            { text: `Time : ${new Date(first.invtime).toLocaleTimeString()}`, alignment: 'right', fontSize: 7 }
          ]
        },
        {
          columns: [
            { text: `Bill : ${first.Billno}`, fontSize: 7 },
            { text: `Pax : ${first.pax || 0}`, alignment: 'right', fontSize: 7 }
          ]
        },
        {
          columns: [
            { text: `Delivery Date/Time : ${first.deliverydatetime}`, fontSize: 7 }
          ]
        },
        {
          text: `Customer Name : ${first.customername || '-'}`,
          fontSize: 7
        },
        {
          text: `Mobile Number : ${first.mobileno || '-'}`,
          fontSize: 7,
          margin: [0, 0, 0, 5]
        },
        {
          table: {
            widths: [10, '*', 25, 35],
            body: [
              [
                { text: 'Sl #', fontSize: 7, bold: true },
                { text: 'Menu', fontSize: 7, bold: true },
                { text: 'Qty', fontSize: 7, bold: true, alignment: 'center' },
                { text: 'Amount(QAR)', fontSize: 7, bold: true, alignment: 'right' }
              ],
              ...menuRows
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            paddingTop: () => 2,
            paddingBottom: () => 2,
            dontBreakRows: true
          },
          margin: [0, 0, 0, 5]
        },
        { text: 'خبز عربي', alignment: 'center', fontSize: 7, margin: [0, 0, 0, 5] },
        {
          columns: [
            { text: 'Total :', fontSize: 7 },
            { text: totalAmount, alignment: 'right', fontSize: 7 }
          ]
        },
        {
          columns: [
            { text: 'Delivery Charge :', fontSize: 7 },
            { text: deliveryCharge, alignment: 'right', fontSize: 7 }
          ]
        },
        {
          columns: [
            { text: 'Net Amount :', fontSize: 7 },
            { text: netAmount, alignment: 'right', fontSize: 7 }
          ]
        },
        {
          columns: [
            { text: 'Paid Amount :', fontSize: 7 },
            { text: '0.00', alignment: 'right', fontSize: 7 }
          ]
        },
        {
          text: 'SETTLEMENT DETAILS',
          bold: true,
          fontSize: 7,
          margin: [0, 5, 0, 2]
        },
        {
          columns: [
            { text: 'Staff Payable :', fontSize: 7 },
            { text: netAmount, alignment: 'right', fontSize: 7 }
          ]
        },
        {
          text: `Staff : ${first.customername || '-'}`,
          fontSize: 7,
          decoration: 'underline',
          margin: [0, 2, 0, 5]
        },
        {
          text: '** THANK YOU FOR DINING WITH US **',
          alignment: 'center',
          fontSize: 7,
          margin: [0, 2, 0, 2]
        },
        {
          text: 'Comments..................................................',
          fontSize: 7,
          margin: [0, 2, 0, 2]
        },
        {
          text: 'Sign...............................................................',
          fontSize: 7,
          margin: [0, 2, 0, 4]
        }
      );
  
      // Add page break between invoices (except after last one)
      if (idx < Object.values(groupedData).length - 1) {
        content.push({ text: '', pageBreak: 'after' });
      }
    });
  
    const docDefinition = {
      pageSize: { width: 220, height: 800 }, // 80mm width x approx. A4 height
      pageMargins: [5, 5, 5, 5],
      content
    };
  
    pdfMake.createPdf(docDefinition).open(); // or .print()
  };