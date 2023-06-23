import { MagnifyingGlass } from 'phosphor-react';
import { Suspense, memo, useDeferredValue, useEffect, useMemo } from 'react';
import { getExplorerItemData, useLibraryQuery } from '@sd/client';
import { SearchParams, SearchParamsSchema } from '~/app/route-schemas';
import {
	getExplorerStore,
	useExplorerStore,
	useExplorerTopBarOptions,
	useZodSearchParams
} from '~/hooks';
import Explorer from './Explorer';
import { TopBarPortal } from './TopBar/Portal';
import TopBarOptions from './TopBar/TopBarOptions';

const SearchExplorer = memo((props: { args: SearchParams }) => {
	const explorerStore = useExplorerStore();
	const { explorerViewOptions, explorerControlOptions, explorerToolOptions } =
		useExplorerTopBarOptions();

	const { search, ...args } = props.args;

	const query = useLibraryQuery(['search.paths', { ...args, filter: { search } }], {
		suspense: true,
		enabled: !!search,
		onSuccess: () => getExplorerStore().resetNewThumbnails()
	});

	const items = useMemo(() => {
		const items = query.data?.items;

		if (explorerStore.layoutMode !== 'media') return items;

		return items?.filter((item) => {
			const { kind } = getExplorerItemData(item);
			return kind === 'Video' || kind === 'Image';
		});
	}, [query.data, explorerStore.layoutMode]);

	useEffect(() => {
		getExplorerStore().selectedRowIndex = null;
	}, [search]);

	return (
		<>
			{items && items.length > 0 ? (
				<>
					<TopBarPortal
						right={
							<TopBarOptions
								options={[
									explorerViewOptions,
									explorerToolOptions,
									explorerControlOptions
								]}
							/>
						}
					/>
					<Explorer items={items} />
				</>
			) : (
				<div className="flex flex-1 flex-col items-center justify-center">
					{!search && (
						<MagnifyingGlass size={110} className="mb-5 text-ink-faint" opacity={0.3} />
					)}
					<p className="text-xs text-ink-faint">
						{search ? `No results found for "${search}"` : 'Search for files...'}
					</p>
				</div>
			)}
		</>
	);
});

export const Component = () => {
	const [searchParams] = useZodSearchParams(SearchParamsSchema);

	const search = useDeferredValue(searchParams);

	return (
		<Suspense fallback="LOADING FIRST RENDER">
			<SearchExplorer args={search} />
		</Suspense>
	);
};
