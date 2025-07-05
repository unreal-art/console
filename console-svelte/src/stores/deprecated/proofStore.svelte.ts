interface IProof {
	id: string;
	label: string;
	content: any;
	date: string;
}
const ProofStore1 = $state(new Array<IProof>());

export const ProofDB = {
	get value(): IProof[] {
		return ProofStore1;
	},
	set value(proof: IProof) {
		ProofStore1.push(proof);
	},
};

// TODO: this stores is just for testing purposes
