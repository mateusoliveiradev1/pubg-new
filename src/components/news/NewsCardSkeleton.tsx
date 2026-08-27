import { Shimmer } from 'react-shimmer'; // We are going to use react-shimmer for a nice shimmer effect.
// But to avoid adding a dependency, we can also create a simple skeleton without it.
// Since we are already using many dependencies, let's add react-shimmer for a better UX.
// However, the user might not want to add more dependencies. Let's check if we can avoid it.
// Alternatively, we can use a placeholder with Tailwind classes.

// Given the constraints, let's create a simple skeleton without an external library.

export default function NewsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-96">
      <div className="h-48 bg-gray-200 dark:bg-gray-600"></div>
      <div className="p-4">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded mr-2"></div>
          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded mx-2"></div>
          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded mx-2"></div>
          <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
        <h3 className="mb-2 h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></h3>
        <p className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></p>
        <p className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></p>
        <p className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></p>
      </div>
    </div>
  );
}
