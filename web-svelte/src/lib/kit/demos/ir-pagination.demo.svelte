<script lang="ts">
	import Pagination from '$lib/kit/organisms/ir/Pagination.svelte';

	let page = $state(2);
	const pageSize = 15;
	const total = 230;
</script>

<div class="flex flex-col gap-4">
	<Pagination {page} {pageSize} {total} onpage={(next) => (page = next)} />
	<Pagination page={1} {pageSize} {total} onpage={() => {}} />
	<Pagination page={16} {pageSize} {total} onpage={() => {}} />
	<Pagination page={1} {pageSize} total={0} onpage={() => {}} />
</div>
