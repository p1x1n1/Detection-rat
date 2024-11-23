const sum_digit = (number) =>{
	let sum = 0;
	let digit = number.toString().split('');
	for (let i = 0; i < digit.length; i++){
		sum += parseInt(digit[i]);
	}
	return sum
	
}

const findNumber = () =>{
let res_number = [];

for(let i = 0; i <= 1000; i++) {
	if (i%3 ==0 && i%5!=0 && sum_digit(i)<10){
		res_number.push(i);
	}
}

return res_number;

}

console.log(findNumber());