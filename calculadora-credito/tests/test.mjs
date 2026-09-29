import assert from 'node:assert/strict';
import {payment, principal, periods, rate, annualEquivalent} from '../js/core/price.js';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const pv=50000,i=.015,n=36,pmt=payment(pv,i,n);
near(principal(pmt,i,n),pv,1e-6); near(periods(pv,pmt,i),n,1e-8); near(rate(pv,pmt,n),i,1e-10); near(payment(12000,0,12),1000); near(annualEquivalent(.01),Math.pow(1.01,12)-1);
// Recover a rate from a payment rounded to cents, as happens in real contracts.
const contractPv=37850, contractRate=.0187, contractN=48;
const roundedPmt=Math.round(payment(contractPv,contractRate,contractN)*100)/100;
const recovered=rate(contractPv,roundedPmt,contractN);
near(payment(contractPv,recovered,contractN),roundedPmt,1e-8);
assert.ok(Math.abs(recovered-contractRate)<1e-7, 'Taxa recuperada divergiu além da tolerância esperada.');
console.log('OK', {pmt, recoveredRate:rate(pv,pmt,n)});